/**
 * SCRIPT DE PERDÓN COMERCIAL DE RECARGOS POR MORA
 * 
 * Propósito:
 * Aplicar un perdón comercial explícito sobre recargos generados en un ciclo determinado
 * para una lista específica de clientes (decisión comercial, no corrección de bug).
 * 
 * Reglas de negocio y seguridad:
 * 1. Dry-run por defecto. Escribe cambios ÚNICAMENTE con el flag --apply.
 * 2. Parámetros requeridos:
 *    - --perdonar-ids=ID1,ID2,...
 *    - --ciclo=MM/YYYY (ej. 10/2026)
 * 3. Para cada cliente:
 *    - Verificar que exista exactamente UN recargo del ciclo.
 *    - Si no existe, hay más de uno, o ya fue perdonado (ya tiene BONIFICACION para ese ciclo), saltar y reportar (idempotente).
 *    - NO borrar el RECARGO original.
 *    - Insertar movimiento tipo 'BONIFICACION' por el mismo monto del recargo:
 *      descripción: "Bonificación recargo por mora MM/YYYY - perdón comercial".
 *      mismo branchId del cliente si corresponde.
 *    - Recalcular saldo y estado_pago exactamente con la lógica de cargos.service.js.
 * 4. Muestra base destino, confirmación escrita interactiva ('SI'), mysqldump de seguridad verificado (> 0 bytes).
 * 5. Una transacción por cliente.
 * 6. Genera JSON de respaldo compatible con restaurar_recargos_10_2026.js.
 * 7. Reporta detalle: saldo/estado antes y después, y si queda bloqueado (con motivo).
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

// Parsear argumento --perdonar-ids=...
const idsArg = process.argv.find(arg => arg.startsWith('--perdonar-ids='));
if (!idsArg) {
    console.error("❌ ERROR: Debe especificar los IDs a perdonar con --perdonar-ids=ID1,ID2,...");
    process.exit(1);
}

const targetIds = idsArg.split('=')[1]
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n));

if (targetIds.length === 0) {
    console.error("❌ ERROR: La lista de IDs a perdonar está vacía o es inválida.");
    process.exit(1);
}

// Parsear argumento --ciclo=MM/YYYY
const cicloArg = process.argv.find(arg => arg.startsWith('--ciclo='));
if (!cicloArg) {
    console.error("❌ ERROR: Debe especificar el ciclo con --ciclo=MM/YYYY (ej. --ciclo=10/2026)");
    process.exit(1);
}
const ciclo = cicloArg.split('=')[1].trim();
if (!/^\d{2}\/\d{4}$/.test(ciclo)) {
    console.error("❌ ERROR: Formato de ciclo inválido. Use MM/YYYY (ej. 10/2026)");
    process.exit(1);
}

const prisma = new PrismaClient({
    datasources: {
        db: { url: databaseUrl }
    }
});

/**
 * Lógica exacta de recálculo de saldo de cargos.service.js (líneas 183-196)
 */
function recalcularSaldoYEstado(movimientos) {
    let nuevoSaldo = 0;
    movimientos.forEach(mov => {
        const monto = parseFloat(mov.monto);
        if (mov.tipo === 'CARGO' || mov.tipo === 'RECARGO') {
            nuevoSaldo -= monto;
        } else if (mov.tipo === 'INGRESO' || mov.tipo === 'PAGO') {
            nuevoSaldo += monto;
        } else {
            nuevoSaldo += monto; // 'BONIFICACION' suma crédito
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
    const backupFile = path.join(backupDir, `backup_pre_perdon_${dbName}_${timestamp}.sql`);

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
        console.error("❌ ERROR CRÍTICO al realizar backup con mysqldump:", e.message);
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
    console.log("=== SCRIPT DE PERDÓN COMERCIAL DE RECARGOS (DECISIÓN COMERCIAL)             ===");
    console.log("================================================================================");
    console.log(`📌 Base de datos destino: [ ${dbName} ] en ${dbHost}:${dbPort}`);
    console.log(`📌 Modo de ejecución:     ${isApply ? '🚨 APLICAR CAMBIOS (--apply)' : '🔍 DRY-RUN (Solo lectura / Simulación)'}`);
    console.log(`📌 Ciclo evaluado:        ${ciclo}`);
    console.log(`📌 IDs a evaluar:         ${targetIds.join(', ')} (Total: ${targetIds.length})`);
    console.log("================================================================================\n");

    const clientes = await prisma.cliente.findMany({
        where: { id: { in: targetIds } },
        include: {
            plan: true,
            movimientocuenta: { orderBy: { fecha: 'asc' } },
            pago: { orderBy: { fecha: 'desc' } }
        },
        orderBy: { id: 'asc' }
    });

    const encontradosIds = new Set(clientes.map(c => c.id));
    const faltantes = targetIds.filter(id => !encontradosIds.has(id));
    if (faltantes.length > 0) {
        console.warn(`⚠️ ADVERTENCIA: Los siguientes IDs no existen en la base de datos: ${faltantes.join(', ')}\n`);
    }

    const evaluacion = [];
    const descripcionBonificacion = `Bonificación recargo por mora ${ciclo} - perdón comercial`;

    for (const c of clientes) {
        const alumno = `${c.nombre} ${c.apellido}`.trim();
        const cuota = c.plan ? parseFloat(c.plan.precio) : 0;

        // 1. Buscar recargos del ciclo
        const recargosDelCiclo = c.movimientocuenta.filter(m => 
            m.tipo === 'RECARGO' && m.descripcion.includes(ciclo)
        );

        // 2. Buscar si ya existe una bonificación de perdón para ese ciclo
        const yaTieneBonificacion = c.movimientocuenta.some(m =>
            m.tipo === 'BONIFICACION' && 
            m.descripcion.includes(ciclo) && 
            m.descripcion.includes('perdón comercial')
        );

        let accion = 'SALTAR';
        let motivo = '';
        let recargoTarget = null;
        let saldoProyectado = c.saldo;
        let estadoProyectado = c.estado_pago;

        if (yaTieneBonificacion) {
            motivo = `Ya cuenta con una BONIFICACION de perdón comercial para el ciclo ${ciclo} (idempotente).`;
        } else if (recargosDelCiclo.length === 0) {
            motivo = `No se encontró ningún RECARGO para el ciclo ${ciclo}.`;
        } else if (recargosDelCiclo.length > 1) {
            motivo = `Se encontraron MÚLTIPLES recargos (${recargosDelCiclo.length}) para el ciclo ${ciclo}. Requiere revisión manual.`;
        } else {
            // Exactamente un recargo y sin bonificación previa
            recargoTarget = recargosDelCiclo[0];
            accion = 'PERDONAR';
            motivo = `Recargo de $${recargoTarget.monto} encontrado. Se insertará BONIFICACION por $${recargoTarget.monto}.`;

            // Proyectar saldo sumando la nueva bonificación
            const movsSimulados = [
                ...c.movimientocuenta,
                { tipo: 'BONIFICACION', monto: recargoTarget.monto }
            ];
            const recalculo = recalcularSaldoYEstado(movsSimulados);
            saldoProyectado = recalculo.nuevoSaldo;
            estadoProyectado = recalculo.nuevoEstadoPago;
        }

        // Determinar si queda bloqueado y motivo
        const quedaBloqueado = estadoProyectado === 'MOROSO' || saldoProyectado < 0;
        let motivoBloqueo = 'NO (Al día)';
        if (quedaBloqueado) {
            const deudaRestante = Math.abs(saldoProyectado);
            const pagosPendientes = c.pago.filter(p => p.estado === 'PENDIENTE');
            if (pagosPendientes.length > 0) {
                const totalPendiente = pagosPendientes.reduce((acc, p) => acc + p.monto, 0);
                motivoBloqueo = `SÍ (Saldo -$${deudaRestante}): Sigue debiendo cuota ($${cuota}), tiene aviso de pago pendiente ($${totalPendiente})`;
            } else {
                motivoBloqueo = `SÍ (Saldo -$${deudaRestante}): Debe cuota mensual sin comprobante de pago`;
            }
        }

        evaluacion.push({
            id: c.id,
            alumno,
            plan: c.plan?.nombre || 'Sin plan',
            cuota,
            accion,
            motivo,
            recargoTarget,
            saldoAntes: c.saldo,
            saldoDespues: saldoProyectado,
            deltaSaldo: saldoProyectado - c.saldo,
            estadoAntes: c.estado_pago,
            estadoDespues: estadoProyectado,
            quedaBloqueado,
            motivoBloqueo,
            branchId: c.branchId,
            clienteRaw: c
        });
    }

    console.log("=== EVALUACIÓN DE PERDÓN COMERCIAL POR CLIENTE ===");
    console.table(evaluacion.map(e => ({
        ID: e.id,
        Alumno: e.alumno,
        Acción: e.accion,
        'Recargo Monto': e.recargoTarget ? `$${e.recargoTarget.monto}` : '-',
        'Saldo Antes': `$${e.saldoAntes}`,
        'Saldo Después': `$${e.saldoDespues}`,
        'Delta Saldo': `+$${e.deltaSaldo}`,
        'Estado Antes': e.estadoAntes,
        'Estado Después': e.estadoDespues,
        '¿Queda Bloqueado?': e.quedaBloqueado ? 'SÍ (MOROSO)' : 'NO (ALDIA)',
        'Motivo / Estado': e.motivoBloqueo
    })));

    const aProcesar = evaluacion.filter(e => e.accion === 'PERDONAR');
    console.log(`\n📊 Resumen de evaluación:`);
    console.log(`- Clientes a procesar con perdón comercial: ${aProcesar.length}`);
    console.log(`- Clientes omitidos (idempotencia / sin recargo): ${evaluacion.length - aProcesar.length}`);

    if (aProcesar.length === 0) {
        console.log("\nNo hay clientes pendientes de perdón comercial. Nada que aplicar.");
        return;
    }

    if (!isApply) {
        console.log("\n================================================================================");
        console.log("🔍 MODO DRY-RUN COMPLETADO.");
        console.log("No se ha modificado ningún dato en la base de datos.");
        console.log(`Para aplicar el perdón real, ejecute: node scripts/perdonar_recargos.js ${process.argv.slice(2).join(' ')} --apply`);
        console.log("================================================================================");
        return;
    }

    // MODO APLICACIÓN REAL
    console.log("\n🚨 ATENCIÓN: Se solicitó APLICAR EL PERDÓN COMERCIAL (--apply).");
    console.log(`Se modificarán ${aProcesar.length} cliente(s) en la base de datos [ ${dbName} ].`);
    const respuesta = await pedirConfirmacion(`¿Confirmás la aplicación del perdón comercial en '${dbName}'? Escribí 'SI' para confirmar: `);
    if (respuesta !== 'SI') {
        console.log("❌ Operación cancelada por el usuario. No se modificó nada.");
        return;
    }

    realizarBackup();

    // Preparar archivo JSON de respaldo para que restaurar_recargos_10_2026.js pueda deshacer si es necesario
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportsDir = path.join(__dirname, '..', 'reportes');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    const backupJsonPath = path.join(reportsDir, `backup_perdon_recargos_${ciclo.replace('/', '_')}_${timestamp}.json`);

    const jsonBackupItems = aProcesar.map(item => ({
        clienteId: item.id,
        alumno: item.alumno,
        accion: 'PERDON_COMERCIAL',
        fechaAplicacion: new Date().toISOString(),
        recargoData: {
            id: item.recargoTarget.id,
            monto: item.recargoTarget.monto,
            tipo: item.recargoTarget.tipo,
            descripcion: item.recargoTarget.descripcion,
            fecha: item.recargoTarget.fecha,
            clienteId: item.recargoTarget.clienteId,
            pagoId: item.recargoTarget.pagoId,
            branchId: item.recargoTarget.branchId
        },
        bonificacionData: {
            monto: item.recargoTarget.monto,
            tipo: 'BONIFICACION',
            descripcion: descripcionBonificacion,
            clienteId: item.id,
            branchId: item.branchId
        },
        saldoAntes: item.saldoAntes,
        saldoDespues: item.saldoDespues,
        estadoAntes: item.estadoAntes,
        estadoDespues: item.estadoDespues
    }));

    fs.writeFileSync(backupJsonPath, JSON.stringify({
        tipoOperacion: 'PERDON_COMERCIAL_RECARGOS',
        ciclo,
        database: dbName,
        timestamp: new Date().toISOString(),
        items: jsonBackupItems
    }, null, 2), 'utf8');

    console.log(`📄 Respaldo JSON generado en: ${backupJsonPath}`);

    console.log("\n🚀 Aplicando bonificaciones de perdón comercial cliente por cliente...");
    let exitosos = 0;
    let fallidos = 0;

    for (const item of aProcesar) {
        try {
            await prisma.$transaction(async (tx) => {
                // 1. Insertar movimiento 'BONIFICACION' sin tocar el RECARGO existente
                const nuevaBonificacion = await tx.movimientocuenta.create({
                    data: {
                        monto: item.recargoTarget.monto,
                        tipo: 'BONIFICACION',
                        descripcion: descripcionBonificacion,
                        fecha: new Date(),
                        clienteId: item.id,
                        ...(item.branchId && { branchId: item.branchId })
                    }
                });

                // 2. Obtener todos los movimientos actualizados para recálculo exacto
                const todosLosMovs = await tx.movimientocuenta.findMany({
                    where: { clienteId: item.id },
                    orderBy: { fecha: 'asc' }
                });

                const { nuevoSaldo, nuevoEstadoPago } = recalcularSaldoYEstado(todosLosMovs);

                // 3. Actualizar cliente
                await tx.cliente.update({
                    where: { id: item.id },
                    data: {
                        saldo: nuevoSaldo,
                        estado_pago: nuevoEstadoPago
                    }
                });

                console.log(`  ✅ [Cliente ${item.id} - ${item.alumno}]`);
                console.log(`     - RECARGO ID ${item.recargoTarget.id} ($${item.recargoTarget.monto}) PRESERVADO intacto.`);
                console.log(`     - BONIFICACION ID ${nuevaBonificacion.id} ($${item.recargoTarget.monto}) INSERTADA.`);
                console.log(`     - Saldo: $${item.saldoAntes} -> $${nuevoSaldo} (Delta: +$${item.recargoTarget.monto}).`);
                console.log(`     - Estado pago: ${item.estadoAntes} -> ${nuevoEstadoPago}.`);
                console.log(`     - ¿Queda bloqueado?: ${item.motivoBloqueo}`);
            });
            exitosos++;
        } catch (e) {
            console.error(`  ❌ Error al procesar Cliente ${item.id} (${item.alumno}):`, e.message);
            fallidos++;
        }
    }

    console.log("\n================================================================================");
    console.log(`🎉 PROCESO FINALIZADO: ${exitosos} clientes perdonados con éxito, ${fallidos} errores.`);
    console.log(`Respaldo JSON disponible para reversión en: ${backupJsonPath}`);
    console.log("================================================================================");
}

main()
    .catch((err) => {
        console.error("❌ Error en la ejecución:", err);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
