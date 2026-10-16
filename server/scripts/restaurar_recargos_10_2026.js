/**
 * SCRIPT DE RESTAURACIÓN: RECARGOS 10/2026 DESDE BACKUP JSON
 * 
 * Propósito:
 * Reinsertar las filas de RECARGO que hayan sido eliminadas por el script de corrección
 * y deshacer las filas de 'BONIFICACION' generadas por la tolerancia,
 * utilizando el JSON de respaldo generado previamente.
 * 
 * Reglas de seguridad:
 * - Dry-run por defecto (simulación).
 * - Escribe cambios ÚNICAMENTE con el flag --apply.
 * - Lee DATABASE_URL de process.env.DATABASE_URL.
 * - Muestra la base de datos destino y pide confirmación escrita interactiva.
 * - Genera un backup previo con mysqldump (> 0 bytes) antes de aplicar.
 * - No usa IDs fijos (deja autoincrement para evitar colisiones).
 * - Una transacción por cliente.
 * - Idempotente: verifica si ya existe el recargo antes de insertar.
 * - Deshace cualquier bonificación generada por la corrección.
 * - Recalcula saldo y estado_pago exactamente con la lógica oficial.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("❌ ERROR: La variable de entorno DATABASE_URL no está definida.");
    process.exit(1);
}

const dbUrlRegex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
const match = databaseUrl.match(dbUrlRegex);
if (!match) {
    console.error("❌ ERROR: DATABASE_URL no tiene un formato MySQL válido.");
    process.exit(1);
}

const [, dbUser, dbPass, dbHost, dbPort, dbNameWithParams] = match;
const dbName = dbNameWithParams.split('?')[0];
const isApply = process.argv.includes('--apply');

// Buscar argumento --file si existe
let jsonFile = null;
const fileArgIndex = process.argv.indexOf('--file');
if (fileArgIndex !== -1 && process.argv[fileArgIndex + 1]) {
    jsonFile = path.resolve(process.argv[fileArgIndex + 1]);
} else {
    // Buscar el backup JSON más reciente en el directorio de reportes
    const reportsDir = path.join(__dirname, '..', 'reportes');
    if (fs.existsSync(reportsDir)) {
        const files = fs.readdirSync(reportsDir)
            .filter(f => (f.startsWith('backup_recargos_eliminados_') || f.startsWith('backup_perdon_recargos_')) && f.endsWith('.json'))
            .map(f => ({ name: f, mtime: fs.statSync(path.join(reportsDir, f)).mtimeMs }))
            .sort((a, b) => b.mtime - a.mtime);
        if (files.length > 0) {
            jsonFile = path.join(reportsDir, files[0].name);
        }
    }
}

const prisma = new PrismaClient({
    datasources: {
        db: { url: databaseUrl }
    }
});

function recalcularSaldoYEstado(movimientos) {
    let nuevoSaldo = 0;
    movimientos.forEach(mov => {
        const monto = parseFloat(mov.monto);
        if (mov.tipo === 'CARGO' || mov.tipo === 'RECARGO') {
            nuevoSaldo -= monto;
        } else if (mov.tipo === 'INGRESO' || mov.tipo === 'PAGO') {
            nuevoSaldo += monto;
        } else {
            nuevoSaldo += monto;
        }
    });

    const nuevoEstadoPago = nuevoSaldo < 0 ? 'MOROSO' : 'ALDIA';
    return { nuevoSaldo, nuevoEstadoPago };
}

function realizarBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupFile = path.join(backupDir, `backup_pre_restauracion_${dbName}_${timestamp}.sql`);

    console.log(`\n📦 Generando backup de seguridad en: ${backupFile}...`);

    let dumpCmd = 'mysqldump';
    const knownPaths = [
        'C:\\Program Files\\MySQL\\MySQL Workbench 8.0 CE\\mysqldump.exe',
        'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
        'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe'
    ];
    for (const p of knownPaths) {
        if (fs.existsSync(p)) {
            dumpCmd = `"${p}"`;
            break;
        }
    }

    try {
        const execString = `${dumpCmd} -h ${dbHost} -P ${dbPort} -u ${dbUser} -p"${dbPass}" ${dbName} > "${backupFile}"`;
        execSync(execString, { stdio: 'inherit' });

        if (!fs.existsSync(backupFile)) {
            throw new Error("El archivo de backup no fue creado.");
        }
        const stats = fs.statSync(backupFile);
        if (stats.size === 0) {
            throw new Error("El archivo de backup fue creado pero está VACÍO (0 bytes).");
        }
        console.log(`✅ Backup completado exitosamente (${(stats.size / 1024).toFixed(1)} KB).`);
        return backupFile;
    } catch (e) {
        console.error("❌ ERROR CRÍTICO al realizar backup:", e.message);
        throw e;
    }
}

function pedirConfirmacion(pregunta) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(pregunta, (respuesta) => {
            rl.close();
            resolve(respuesta.trim().toUpperCase());
        });
    });
}

async function main() {
    console.log("================================================================================");
    console.log("=== SCRIPT DE RESTAURACIÓN DE RECARGOS Y DESHACER BONIFICACIONES             ===");
    console.log("================================================================================");
    console.log(`📌 Base de datos destino: [ ${dbName} ] en ${dbHost}:${dbPort}`);
    console.log(`📌 Modo de ejecución:     ${isApply ? '🚨 APLICAR CAMBIOS (--apply)' : '🔍 DRY-RUN (Solo lectura / Simulación)'}`);
    console.log(`📌 Archivo JSON:          ${jsonFile || 'NO ENCONTRADO'}`);
    console.log("================================================================================\n");

    if (!jsonFile || !fs.existsSync(jsonFile)) {
        console.error("❌ ERROR: No se encontró ningún archivo JSON de respaldo para restaurar.");
        console.error("Especifique uno con --file <ruta> o asegúrese de que existan archivos en reportes/.");
        process.exit(1);
    }

    const jsonParsed = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    let itemsNormalizados = [];

    if (Array.isArray(jsonParsed)) {
        // Formato legado (array directo)
        itemsNormalizados = jsonParsed.map(item => {
            if (item.recargoData) {
                return item;
            }
            return {
                clienteId: item.clienteId,
                alumno: `Cliente #${item.clienteId}`,
                recargoData: item,
                bonificacionData: null
            };
        });
    } else if (jsonParsed && Array.isArray(jsonParsed.items)) {
        // Nuevo formato estructurado
        itemsNormalizados = jsonParsed.items;
    } else {
        console.error("❌ ERROR: Estructura del archivo JSON de respaldo desconocida.");
        process.exit(1);
    }

    console.log(`📖 Se leyeron ${itemsNormalizados.length} registros del archivo de respaldo.\n`);

    const planDeRestauracion = [];

    for (const item of itemsNormalizados) {
        const recargo = item.recargoData;
        const clienteId = item.clienteId || recargo.clienteId;

        const cliente = await prisma.cliente.findUnique({
            where: { id: clienteId },
            include: {
                movimientocuenta: { orderBy: { id: 'asc' } }
            }
        });

        if (!cliente) {
            console.warn(`⚠️ Cliente ID ${clienteId} no existe en la base. Se omite.`);
            continue;
        }

        // Verificar si el recargo ya existe actualmente (idempotencia)
        const yaExisteRecargo = cliente.movimientocuenta.some(m => 
            m.tipo === 'RECARGO' && 
            m.descripcion === recargo.descripcion && 
            Math.abs(m.monto - recargo.monto) < 0.01
        );

        // Verificar si hay bonificaciones a deshacer
        const cicloBuscar = jsonParsed.ciclo || '10/2026';
        const bonificacionesPresentes = cliente.movimientocuenta.filter(m =>
            m.tipo === 'BONIFICACION' &&
            m.descripcion.includes(cicloBuscar)
        );
        const totalBonifADeshacer = bonificacionesPresentes.reduce((acc, b) => acc + b.monto, 0);

        // Simular saldo tras restaurar:
        // Quitar bonificaciones y volver a restar recargo
        const movsSimulados = cliente.movimientocuenta
            .filter(m => !(m.tipo === 'BONIFICACION' && m.descripcion.includes(cicloBuscar)));
        
        if (!yaExisteRecargo) {
            movsSimulados.push({
                tipo: 'RECARGO',
                monto: recargo.monto
            });
        }

        const { nuevoSaldo: saldoSimulado, nuevoEstadoPago: estadoSimulado } = recalcularSaldoYEstado(movsSimulados);

        planDeRestauracion.push({
            clienteId: cliente.id,
            alumno: item.alumno || `${cliente.nombre} ${cliente.apellido}`.trim(),
            recargoMonto: recargo.monto,
            descripcion: recargo.descripcion,
            fechaOriginal: recargo.fecha,
            bonifADeshacer: totalBonifADeshacer,
            yaExisteRecargo,
            saldoActual: cliente.saldo,
            saldoPost: saldoSimulado,
            estadoPost: estadoSimulado,
            rawItem: item
        });
    }

    console.log("=== PLAN DE RESTAURACIÓN ===");
    console.table(planDeRestauracion.map(p => ({
        ID: p.clienteId,
        Alumno: p.alumno,
        Recargo: p.recargoMonto,
        'Deshacer Bonif': p.bonifADeshacer > 0 ? `$${p.bonifADeshacer}` : '$0',
        '¿Recargo Presente?': p.yaExisteRecargo ? 'SÍ' : 'NO',
        'Saldo Actual': p.saldoActual,
        'Saldo Post': p.saldoPost,
        'Estado Post': p.estadoPost
    })));

    const aProcesar = planDeRestauracion.filter(p => !p.yaExisteRecargo || p.bonifADeshacer > 0);
    console.log(`\n📊 Total de clientes a modificar: ${aProcesar.length} (Sin cambios pendientes: ${planDeRestauracion.length - aProcesar.length}).`);

    if (!isApply) {
        console.log("\n================================================================================");
        console.log("ℹ️ MODO DRY-RUN COMPLETADO.");
        console.log("No se ha modificado ningún dato en la base de datos.");
        console.log("Para aplicar la restauración real, ejecute: node scripts/restaurar_recargos_10_2026.js --apply");
        console.log("================================================================================");
        return;
    }

    if (aProcesar.length === 0) {
        console.log("Todos los recargos están presentes y no hay bonificaciones residuales. Nada que hacer.");
        return;
    }

    console.log("\n🚨 ATENCIÓN: Se solicitó APLICAR RESTAURACIÓN (--apply).");
    const respuesta = await pedirConfirmacion(`¿Confirmás la restauración en '${dbName}'? Escribí 'SI' para confirmar: `);
    if (respuesta !== 'SI') {
        console.log("❌ Operación cancelada por el usuario.");
        return;
    }

    realizarBackup();

    console.log("\n🚀 Restaurando clientes y deshaciendo bonificaciones...");
    let exitosos = 0;
    let fallidos = 0;

    for (const plan of aProcesar) {
        try {
            await prisma.$transaction(async (tx) => {
                const recargo = plan.rawItem.recargoData;

                // 1. Eliminar bonificaciones aplicadas durante la corrección o perdón
                const cicloBuscar = jsonParsed.ciclo || '10/2026';
                const borradas = await tx.movimientocuenta.deleteMany({
                    where: {
                        clienteId: plan.clienteId,
                        tipo: 'BONIFICACION',
                        descripcion: { contains: cicloBuscar }
                    }
                });
                if (borradas.count > 0) {
                    console.log(`  🗑️ [Cliente ${plan.clienteId} - ${plan.alumno}] Se eliminaron ${borradas.count} bonificación(es).`);
                }

                // 2. Reinsertar recargo si no existe
                if (!plan.yaExisteRecargo) {
                    await tx.movimientocuenta.create({
                        data: {
                            monto: recargo.monto,
                            tipo: 'RECARGO',
                            descripcion: recargo.descripcion,
                            fecha: new Date(recargo.fecha),
                            clienteId: plan.clienteId,
                            pagoId: recargo.pagoId || null,
                            branchId: recargo.branchId || null
                        }
                    });
                    console.log(`  ➕ [Cliente ${plan.clienteId} - ${plan.alumno}] Recargo restaurado ($${recargo.monto}).`);
                }

                // 3. Recalcular saldo y estado_pago de la cuenta completa
                const movimientosActuales = await tx.movimientocuenta.findMany({
                    where: { clienteId: plan.clienteId }
                });

                const { nuevoSaldo, nuevoEstadoPago } = recalcularSaldoYEstado(movimientosActuales);

                await tx.cliente.update({
                    where: { id: plan.clienteId },
                    data: {
                        saldo: nuevoSaldo,
                        estado_pago: nuevoEstadoPago
                    }
                });

                console.log(`  ✅ [Cliente ${plan.clienteId} - ${plan.alumno}] Saldo actualizado: $${plan.saldoActual} -> $${nuevoSaldo} (${nuevoEstadoPago}).`);
            });
            exitosos++;
        } catch (e) {
            console.error(`  ❌ Error al restaurar Cliente ${plan.clienteId}:`, e.message);
            fallidos++;
        }
    }

    console.log("\n================================================================================");
    console.log(`🎉 RESTAURACIÓN FINALIZADA: ${exitosos} clientes procesados con éxito, ${fallidos} errores.`);
    console.log("================================================================================");
}

main()
    .catch((err) => {
        console.error("❌ Error en la ejecución:", err);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
