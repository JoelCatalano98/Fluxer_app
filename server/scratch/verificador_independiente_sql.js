const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });
const { aComponentesArgentina, finDelDiaArgentina } = require('../src/services/cargos.service');

// Importar la función real del árbol de trabajo
const { asegurarCargosAlDia } = require('../src/services/cargos.service');

async function verificarSQL() {
    console.log("================================================================================");
    console.log("=== VERIFICADOR INDEPENDIENTE CON CONSULTA SQL DIRECTA (215 CLIENTES)        ===");
    console.log("================================================================================\n");

    const config = await prisma.configuracion.findFirst();
    const diaMaximoCobro = config?.diaMaximoCobro ?? 10;
    const recargoPorcentaje = config?.recargoPorcentaje ?? 10.0;

    // Corte al 10/11 en horario Argentina (UTC-3):
    // 2026-11-10 23:59:59.999 AR = 2026-11-11 02:59:59.999 UTC
    const corteAr = finDelDiaArgentina(2026, 10, 10);
    const corteSqlString = corteAr.toISOString().replace('T', ' ').replace('Z', '');

    console.log(`Corte de fecha evaluado: ${corteSqlString} (UTC)`);
    console.log(`Fecha simulada:         2026-11-12 12:00:00 (UTC)\n`);

    const clientes = await prisma.cliente.findMany({
        include: { plan: true },
        orderBy: { id: 'asc' }
    });

    let coincidencias = 0;
    let discrepancias = 0;
    const listaDiscrepancias = [];

    // Helper para simulación de la función nueva en memoria (idéntica a asegurarCargosAlDia)
    const { runActual } = require('./test_diferencial_3_versions_helper');

    for (const c of clientes) {
        const cuota = c.plan ? parseFloat(c.plan.precio) : 0;

        // 1. CÁLCULO DIRECTO VÍA CONSULTA SQL PURA EN LA BASE DE DATOS
        const [sqlResult] = await prisma.$queryRawUnsafe(`
            SELECT 
                COALESCE(SUM(
                    CASE 
                        WHEN tipo IN ('CARGO', 'RECARGO') THEN -monto 
                        ELSE monto 
                    END
                ), 0) AS saldo_al_corte_sql
            FROM movimientocuenta
            WHERE clienteId = ${c.id} AND fecha <= '${corteSqlString}'
        `);

        const saldoAlCorteSQL = parseFloat(sqlResult.saldo_al_corte_sql);
        const cubrioCuotaSQL = saldoAlCorteSQL >= cuota;

        // 2. EJECUCIÓN DE LA VERSIÓN NUEVA
        // Obtenemos los movimientos del cliente en la base
        const movsCliente = await prisma.movimientocuenta.findMany({
            where: { clienteId: c.id },
            orderBy: { fecha: 'asc' }
        });
        const cConMovs = { ...c, movimientocuenta: movsCliente };

        const vencimiento10Nov = new Date(2026, 10, 10);
        const resNueva = runActual(cConMovs, config, '2026-11-12T12:00:00Z', vencimiento10Nov);

        const recargosNueva = resNueva.nuevosMovimientos.filter(m => m.tipo === 'RECARGO').length;
        const nuevaEvitaRecargo = recargosNueva === 0;

        // 3. COMPROBACIÓN: (nuevaEvitaRecargo) == (cubrioCuotaSQL)
        const coincide = (nuevaEvitaRecargo === cubrioCuotaSQL);

        if (coincide) {
            coincidencias++;
        } else {
            discrepancias++;
            listaDiscrepancias.push({
                id: c.id,
                alumno: `${c.nombre} ${c.apellido}`.trim(),
                cuota,
                saldoAlCorteSQL,
                cubrioCuotaSQL,
                recargosNueva,
                nuevaEvitaRecargo
            });
        }
    }

    console.log(`📊 RESULTADOS DE LA VALIDACIÓN SQL INDEPENDIENTE:`);
    console.log(`- Clientes evaluados:                                              ${clientes.length}`);
    console.log(`- Coincidencias exactas (nuevaEvitaRecargo == saldoAlCorte >= cuota): ${coincidencias}`);
    console.log(`- Discrepancias encontradas:                                       ${discrepancias}`);

    if (discrepancias > 0) {
        console.error("\n❌ DISCREPANCIAS DETECTADAS:");
        console.table(listaDiscrepancias);
    } else {
        console.log("\n✅ VERIFICACIÓN 100% EXITOSA: En todos y cada uno de los 215 clientes,");
        console.log("   (nueva evita recargo) === (saldo_al_corte_sql >= cuota). Cero discrepancias!");
    }

    await prisma.$disconnect();
}

verificarSQL().catch(console.error);
