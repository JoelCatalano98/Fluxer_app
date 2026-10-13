/**
 * SCRIPT DE AUDITORÍA Y CORRECCIÓN DE DATOS: RECARGOS INDEBIDOS 10/2026
 * 
 * Reglas de seguridad:
 * - Dry-run por defecto (solo lectura).
 * - Escribe cambios ÚNICAMENTE con el flag --apply.
 * - Lee DATABASE_URL de process.env.DATABASE_URL.
 * - Muestra la base de datos destino e interactúa solicitando confirmación escrita.
 * - Genera y valida un backup mysqldump (> 0 bytes) antes de aplicar.
 * - Transaccional por cliente e idempotente.
 * 
 * Parámetros:
 * - --tolerancia=N (default 0): margen de tolerancia en pesos para considerar cubierta la cuota.
 *   Regla: si saldo_al_corte + tolerancia >= cuota -> REVERTIR.
 * - Compensación por bonificación: tras revertir recargo, si saldo < 0 y |saldo| <= tolerancia,
 *   se inserta movimiento tipo 'BONIFICACION' por |saldo| para dejarlo en $0 y estado 'ALDIA'.
 * - Dulce Cardozo (114): sin pagos en octubre -> NO TOCAR.
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

// Parsear argumento --tolerancia=N (default 0)
let tolerancia = 0;
const tolArg = process.argv.find(arg => arg.startsWith('--tolerancia='));
if (tolArg) {
    const parsed = parseFloat(tolArg.split('=')[1]);
    if (isNaN(parsed) || parsed < 0) {
        console.error("❌ ERROR: El valor de --tolerancia debe ser un número mayor o igual a 0.");
        process.exit(1);
    }
    tolerancia = parsed;
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
    const backupFile = path.join(backupDir, `backup_pre_correccion_${dbName}_${timestamp}.sql`);

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
    console.log("=== SCRIPT DE AUDITORÍA Y CORRECCIÓN DE RECARGOS INDEBIDOS (CICLO 10/2026)   ===");
    console.log("================================================================================");
    console.log(`📌 Base de datos destino: [ ${dbName} ] en ${dbHost}:${dbPort}`);
    console.log(`📌 Modo de ejecución:     ${isApply ? '🚨 APLICAR CAMBIOS (--apply)' : '🔍 DRY-RUN (Solo lectura / Simulación)'}`);
    console.log(`📌 Margen Tolerancia:     $${tolerancia} (--tolerancia=${tolerancia})`);
    console.log("================================================================================\n");

    const config = await prisma.configuracion.findFirst();
    const diaMaximoCobro = config?.diaMaximoCobro ?? 10;
    
    // Corte exacto: fin del día díaMaximoCobro en hora Argentina (UTC-3)
    // 10 de octubre 23:59:59.999 UTC-3 == 2026-10-11T02:59:59.999Z
    const anio = 2026;
    const mes = 9; // Octubre (0-indexed)
    const corteUTC = new Date(Date.UTC(anio, mes, diaMaximoCobro, 23 + 3, 59, 59, 999));
    
    console.log(`⚙️ Parámetros de corte:`);
    console.log(`   - diaMaximoCobro:               ${diaMaximoCobro}`);
    console.log(`   - Corte fin de día (Arg UTC-3): ${diaMaximoCobro}/10/${anio} 23:59:59.999`);
    console.log(`   - Timestamp corte UTC:          ${corteUTC.toISOString()}\n`);

    // Buscar recargos con descripción '10/2026'
    const recargos = await prisma.movimientocuenta.findMany({
        where: {
            tipo: 'RECARGO',
            descripcion: { contains: '10/2026' }
        },
        include: {
            cliente: {
                include: {
                    plan: true,
                    movimientocuenta: {
                        orderBy: { id: 'asc' }
                    }
                }
            }
        },
        orderBy: { id: 'asc' }
    });

    console.log(`🔍 Se encontraron ${recargos.length} recargos asociados a '10/2026'.\n`);

    const resultados = [];
    const revertibles = [];
    const revisionManual = [];
    const noTocar = [];

    for (const r of recargos) {
        const c = r.cliente;

        // 1. REGLA DE INTEGRIDAD CONTABLE:
        // Recalcular saldo total de movimientos y comparar con c.saldo
        const { nuevoSaldo: saldoTotalCalculado } = recalcularSaldoYEstado(c.movimientocuenta);
        const diferenciaIntegridad = Math.abs(saldoTotalCalculado - c.saldo);
        const hayInconsistenciaSaldo = diferenciaIntegridad > 0.01;

        // 2. Determinar cuota base de 10/2026
        const cargoCuota = c.movimientocuenta.find(m => m.tipo === 'CARGO' && m.descripcion.includes('10/2026'));
        const cuotaMonto = cargoCuota ? cargoCuota.monto : (c.plan?.precio ? Number(c.plan.precio) : 0);

        // 3. REGLA saldo_al_corte:
        // Suma de movimientos con fecha <= corteUTC, EXCLUYENDO el CARGO y el RECARGO de 10/2026
        const movsAlCorte = c.movimientocuenta.filter(m => {
            if (m.fecha > corteUTC) return false;
            if (m.tipo === 'CARGO' && m.descripcion.includes('10/2026')) return false;
            if (m.tipo === 'RECARGO' && m.descripcion.includes('10/2026')) return false;
            return true;
        });

        const { nuevoSaldo: saldoAlCorte } = recalcularSaldoYEstado(movsAlCorte);

        // Pagos en el mes de octubre (para descartar clientes que no abonaron nada en octubre)
        const pagosEnOctubre = c.movimientocuenta.filter(m => 
            (m.tipo === 'INGRESO' || m.tipo === 'PAGO') &&
            m.fecha >= new Date('2026-10-01T00:00:00.000Z') &&
            m.fecha <= new Date('2026-10-31T23:59:59.999Z')
        );
        const cantPagosOctubre = pagosEnOctubre.length;

        // Múltiples recargos del mismo ciclo
        const recargosMismoCiclo = c.movimientocuenta.filter(m => m.tipo === 'RECARGO' && m.descripcion.includes('10/2026')).length;

        // 4. CLASIFICACIÓN
        let categoria = '';
        let motivo = '';

        if (hayInconsistenciaSaldo) {
            categoria = 'MANUAL';
            motivo = `Inconsistencia contable: saldo en clientes ($${c.saldo}) != movimientos ($${saldoTotalCalculado})`;
        } else if (recargosMismoCiclo > 1) {
            categoria = 'MANUAL';
            motivo = `Múltiples recargos del mismo ciclo detectados (${recargosMismoCiclo})`;
        } else if (cantPagosOctubre === 0) {
            categoria = 'NO TOCAR';
            motivo = 'Sin pagos registrados en octubre';
        } else if (saldoAlCorte + tolerancia >= cuotaMonto && cuotaMonto > 0) {
            categoria = 'REVERTIR';
            if (saldoAlCorte >= cuotaMonto) {
                motivo = `saldo_al_corte ($${saldoAlCorte}) >= cuota ($${cuotaMonto})`;
            } else {
                motivo = `saldo_al_corte ($${saldoAlCorte}) + tol ($${tolerancia}) >= cuota ($${cuotaMonto})`;
            }
        } else if (saldoAlCorte > 0 && (saldoAlCorte + tolerancia) < cuotaMonto) {
            categoria = 'MANUAL';
            motivo = `Pago parcial a término: saldo_al_corte ($${saldoAlCorte}) + tol ($${tolerancia}) < cuota ($${cuotaMonto})`;
        } else {
            categoria = 'NO TOCAR';
            motivo = `Sin cobertura a término: saldo_al_corte ($${saldoAlCorte}) <= 0`;
        }

        // 5. SIMULACIÓN DE SALDO POST-REVERSIÓN Y BONIFICACIÓN
        const movimientosSinEsteRecargo = c.movimientocuenta.filter(m => m.id !== r.id);
        const { nuevoSaldo: saldoPostRecargo } = recalcularSaldoYEstado(movimientosSinEsteRecargo);

        let bonificacionCalculada = 0;
        let saldoFinalSimulado = c.saldo;
        let estadoFinalSimulado = c.estado_pago;

        if (categoria === 'REVERTIR') {
            if (saldoPostRecargo < 0 && Math.abs(saldoPostRecargo) <= tolerancia) {
                // Compensación por tolerancia
                bonificacionCalculada = Math.abs(saldoPostRecargo);
                saldoFinalSimulado = 0;
                estadoFinalSimulado = 'ALDIA';
            } else {
                bonificacionCalculada = 0;
                saldoFinalSimulado = saldoPostRecargo;
                estadoFinalSimulado = saldoFinalSimulado < 0 ? 'MOROSO' : 'ALDIA';
            }
        }

        const bloqueadoAntes = c.estado_pago === 'MOROSO' || c.saldo < 0;
        const bloqueadoDespues = estadoFinalSimulado === 'MOROSO' || saldoFinalSimulado < 0;

        const fila = {
            clienteId: c.id,
            alumno: `${c.nombre} ${c.apellido}`.trim(),
            recargoId: r.id,
            categoria,
            motivo,
            cuota: cuotaMonto,
            saldo_al_corte: saldoAlCorte,
            pagos_octubre: cantPagosOctubre,
            recargo: r.monto,
            saldo_antes: c.saldo,
            saldo_post_recargo: saldoPostRecargo,
            bonificacion: bonificacionCalculada,
            saldo_despues: saldoFinalSimulado,
            estado_antes: c.estado_pago,
            estado_despues: estadoFinalSimulado,
            bloqueado_antes: bloqueadoAntes,
            bloqueado_despues: bloqueadoDespues,
            fecha_aprobacion_confiable: 'NO',
            recargoData: r
        };

        resultados.push(fila);
        if (categoria === 'REVERTIR') revertibles.push(fila);
        else if (categoria === 'MANUAL') revisionManual.push(fila);
        else noTocar.push(fila);
    }

    // 6. Tabla por consola
    console.log(`=== TABLA DE EVALUACIÓN (TOLERANCIA = $${tolerancia}) ===`);
    console.table(resultados.map(r => ({
        ID: r.clienteId,
        Alumno: r.alumno,
        Categoría: r.categoria,
        Motivo: r.motivo,
        Cuota: r.cuota,
        'Saldo Corte': r.saldo_al_corte,
        'Pagos Oct': r.pagos_octubre,
        Recargo: r.recargo,
        'Saldo Antes': r.saldo_antes,
        'Bonif': r.bonificacion,
        'Saldo Final': r.saldo_despues,
        'Estado Final': r.estado_despues,
        'Bloq Final': r.bloqueado_despues
    })));

    // 7. Alumnos que seguirán bloqueados después de la corrección
    const seguiranBloqueados = resultados.filter(r => r.bloqueado_despues);
    console.log("\n⚠️ CLIENTES QUE SEGUIRÁN BLOQUEADOS DESPUÉS DE LA CORRECCIÓN:");
    console.table(seguiranBloqueados.map(r => ({
        ID: r.clienteId,
        Alumno: r.alumno,
        Categoría: r.categoria,
        'Saldo Final': r.saldo_despues,
        'Causa de Bloqueo': r.categoria === 'REVERTIR' 
            ? 'Tenía saldo previo deudor no cubierto por los pagos' 
            : r.motivo
    })));

    // 8. Totales
    console.log("\n📊 RESUMEN TOTALES POR CATEGORÍA:");
    console.log(`- REVERTIR:   ${revertibles.length} alumnos`);
    console.log(`- MANUAL:     ${revisionManual.length} alumnos`);
    console.log(`- NO TOCAR:   ${noTocar.length} alumnos`);
    console.log(`- TOTAL:      ${resultados.length} recargos evaluados`);

    // 9. Exportar CSV
    const reportsDir = path.join(__dirname, '..', 'reportes');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const csvPath = path.join(reportsDir, `auditoria_recargos_10_2026_tol${tolerancia}_${timestampStr}.csv`);
    
    const csvHeaders = [
        'clienteId',
        'alumno',
        'recargoId',
        'categoria',
        'motivo',
        'cuota',
        'saldo_al_corte',
        'tolerancia',
        'pagos_octubre',
        'recargo',
        'saldo_antes',
        'saldo_post_recargo',
        'bonificacion',
        'saldo_despues',
        'estado_antes',
        'estado_despues',
        'bloqueado_antes',
        'bloqueado_despues',
        'fecha_aprobacion_confiable'
    ];
    const csvRows = resultados.map(r => [
        r.clienteId,
        `"${r.alumno}"`,
        r.recargoId,
        r.categoria,
        `"${r.motivo}"`,
        r.cuota,
        r.saldo_al_corte,
        tolerancia,
        r.pagos_octubre,
        r.recargo,
        r.saldo_antes,
        r.saldo_post_recargo,
        r.bonificacion,
        r.saldo_despues,
        r.estado_antes,
        r.estado_despues,
        r.bloqueado_antes,
        r.bloqueado_despues,
        r.fecha_aprobacion_confiable
    ].join(','));

    fs.writeFileSync(csvPath, [csvHeaders.join(','), ...csvRows].join('\n'), 'utf8');
    console.log(`\n📄 Reporte CSV exportado en: ${csvPath}`);

    // Si es DRY-RUN, terminar
    if (!isApply) {
        console.log("\n================================================================================");
        console.log("ℹ️ MODO DRY-RUN COMPLETADO.");
        console.log("No se ha modificado ningún dato en la base de datos.");
        console.log("Para aplicar los cambios reales, ejecute el script con el flag --apply.");
        console.log("================================================================================");
        return;
    }

    // Si es --apply: confirmación y ejecución
    console.log("\n🚨 ATENCIÓN: Se solicitó APLICAR CAMBIOS (--apply).");
    console.log(`Se revertirán ${revertibles.length} recargos indebidos en la base: [ ${dbName} ].`);
    if (tolerancia > 0) {
        const conBonif = revertibles.filter(r => r.bonificacion > 0);
        console.log(`Se aplicará bonificación automática a ${conBonif.length} clientes con saldo remanente <= $${tolerancia}.`);
    }
    
    const respuesta = await pedirConfirmacion(`¿Confirmás la aplicación de cambios en '${dbName}'? Escribí 'SI' para confirmar: `);
    if (respuesta !== 'SI') {
        console.log("❌ Operación cancelada por el usuario. No se aplicó ningún cambio.");
        return;
    }

    realizarBackup();

    console.log("\n🚀 Aplicando reversiones cliente por cliente...");
    let exitosos = 0;
    let fallidos = 0;
    const backupItems = [];

    for (const item of revertibles) {
        try {
            await prisma.$transaction(async (tx) => {
                const recargoExiste = await tx.movimientocuenta.findUnique({
                    where: { id: item.recargoId }
                });

                if (!recargoExiste) {
                    console.log(`  [Cliente ${item.clienteId}] Recargo #${item.recargoId} ya no existe o fue revertido previamente. Omitiendo.`);
                    return;
                }

                // 1. Eliminar recargo indebido
                await tx.movimientocuenta.delete({
                    where: { id: item.recargoId }
                });

                // 2. Obtener movimientos restantes
                const movimientosRestantes = await tx.movimientocuenta.findMany({
                    where: { clienteId: item.clienteId }
                });

                let { nuevoSaldo, nuevoEstadoPago } = recalcularSaldoYEstado(movimientosRestantes);
                let bonificacionData = null;

                // 3. Compensación con bonificación si saldo es negativo y |saldo| <= tolerancia
                if (nuevoSaldo < 0 && Math.abs(nuevoSaldo) <= tolerancia && tolerancia > 0) {
                    const bonifMonto = Math.abs(nuevoSaldo);
                    const bonifMov = await tx.movimientocuenta.create({
                        data: {
                            monto: bonifMonto,
                            tipo: 'BONIFICACION',
                            descripcion: 'Bonificación diferencia aumento/ajuste 10/2026 - corrección',
                            fecha: new Date(),
                            clienteId: item.clienteId,
                            branchId: item.recargoData.branchId || null
                        }
                    });

                    bonificacionData = {
                        id: bonifMov.id,
                        monto: bonifMonto,
                        tipo: 'BONIFICACION',
                        descripcion: bonifMov.descripcion,
                        fecha: bonifMov.fecha
                    };

                    // Recalcular saldo y estado_pago tras bonificación
                    const movimientosConBonif = await tx.movimientocuenta.findMany({
                        where: { clienteId: item.clienteId }
                    });
                    const resFinal = recalcularSaldoYEstado(movimientosConBonif);
                    nuevoSaldo = resFinal.nuevoSaldo;
                    nuevoEstadoPago = resFinal.nuevoEstadoPago;

                    console.log(`  🎁 [Cliente ${item.clienteId} - ${item.alumno}] Bonificación generada por $${bonifMonto}.`);
                }

                // 4. Actualizar cliente con saldo y estado final
                await tx.cliente.update({
                    where: { id: item.clienteId },
                    data: {
                        saldo: nuevoSaldo,
                        estado_pago: nuevoEstadoPago
                    }
                });

                backupItems.push({
                    clienteId: item.clienteId,
                    alumno: item.alumno,
                    recargoData: item.recargoData,
                    bonificacionData
                });

                console.log(`  ✅ [Cliente ${item.clienteId} - ${item.alumno}] Recargo #${item.recargoId} ($${item.recargo}) eliminado. Saldo: $${item.saldo_antes} -> $${nuevoSaldo} (${nuevoEstadoPago}).`);
            });
            exitosos++;
        } catch (errCliente) {
            console.error(`  ❌ Error al procesar Cliente ${item.clienteId}:`, errCliente.message);
            fallidos++;
        }
    }

    // 10. Exportar JSON de respaldo para restauración
    const jsonBackupPath = path.join(reportsDir, `backup_recargos_eliminados_${timestampStr}.json`);
    const payloadRespaldo = {
        metadata: {
            timestamp: timestampStr,
            dbName,
            tolerancia,
            totalRevertidos: exitosos
        },
        items: backupItems
    };
    fs.writeFileSync(jsonBackupPath, JSON.stringify(payloadRespaldo, null, 2), 'utf8');
    console.log(`\n💾 Respaldo JSON exportado en: ${jsonBackupPath}`);

    console.log("\n================================================================================");
    console.log(`🎉 PROCESO FINALIZADO: ${exitosos} revertidos con éxito, ${fallidos} errores.`);
    console.log("================================================================================");
}

main()
    .catch((err) => {
        console.error("❌ Error en la ejecución:", err);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
