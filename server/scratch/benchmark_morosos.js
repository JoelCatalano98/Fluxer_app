const { PrismaClient } = require('@prisma/client');

async function benchmark() {
    console.log("================================================================================");
    console.log("=== BENCHMARK DE RENDIMIENTO: SOLAPA MOROSOS (getClientes filtro='morosos') ===");
    console.log("================================================================================\n");

    const prismaVieja = new PrismaClient({
        datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_test_vieja' } }
    });
    const prismaNueva = new PrismaClient({
        datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_test_nueva' } }
    });

    const clientesVieja = await prismaVieja.cliente.findMany({ select: { id: true } });
    const clientesNueva = await prismaNueva.cliente.findMany({ select: { id: true } });
    console.log(`Población en DB Vieja: ${clientesVieja.length} clientes`);
    console.log(`Población en DB Nueva: ${clientesNueva.length} clientes\n`);

    // -------------------------------------------------------------------------
    // TEST 1: Ejecución completa de asegurarCargosAlDia sobre los 215 clientes
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: asegurarCargosAlDia sobre TODOS los 215 clientes ---");

    // Versión vieja
    process.env.DATABASE_URL = 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_test_vieja';
    delete require.cache[require.resolve('../src/config/prisma')];
    delete require.cache[require.resolve('./cargos.service.HEAD')];
    const { asegurarCargosAlDia: asegurarVieja } = require('./cargos.service.HEAD');

    const t0V1 = performance.now();
    for (const c of clientesVieja) {
        await asegurarVieja(c.id);
    }
    const t1V1 = performance.now();
    const duracionViejaTodos = t1V1 - t0V1;
    console.log(`⏱️  Versión Vieja (215 clientes): ${duracionViejaTodos.toFixed(2)} ms (promedio: ${(duracionViejaTodos / clientesVieja.length).toFixed(2)} ms/cliente)`);

    // Versión nueva
    process.env.DATABASE_URL = 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_test_nueva';
    delete require.cache[require.resolve('../src/config/prisma')];
    delete require.cache[require.resolve('../src/services/cargos.service')];
    const { asegurarCargosAlDia: asegurarNueva } = require('../src/services/cargos.service');

    const t0N1 = performance.now();
    for (const c of clientesNueva) {
        await asegurarNueva(c.id);
    }
    const t1N1 = performance.now();
    const duracionNuevaTodos = t1N1 - t0N1;
    console.log(`⏱️  Versión Nueva (215 clientes): ${duracionNuevaTodos.toFixed(2)} ms (promedio: ${(duracionNuevaTodos / clientesNueva.length).toFixed(2)} ms/cliente)`);

    const diffMs = duracionNuevaTodos - duracionViejaTodos;
    const diffPct = ((duracionNuevaTodos - duracionViejaTodos) / duracionViejaTodos) * 100;
    console.log(`📊 Delta tiempo total: ${diffMs > 0 ? '+' : ''}${diffMs.toFixed(2)} ms (${diffPct > 0 ? '+' : ''}${diffPct.toFixed(1)}%)\n`);

    // -------------------------------------------------------------------------
    // TEST 2: Flujo idéntico del controller getClientes(filtro='morosos')
    // -------------------------------------------------------------------------
    console.log("--- TEST 2: Simulación controladora getClientes con filtro='morosos' ---");

    async function simularGetClientesMorosos(db, fnAsegurar) {
        const tStart = performance.now();
        const hoy = new Date();
        const clientesAtrasados = await db.cliente.findMany({
            where: {
                estado_cliente: 'ACTIVO',
                vencimientoCuota: { lt: hoy }
            },
            select: { id: true }
        });

        for (const c of clientesAtrasados) {
            await fnAsegurar(c.id);
        }

        const where = {
            saldo: { lt: 0 },
            estado_cliente: { not: 'PENDIENTE' }
        };

        const [total, clientes] = await db.$transaction([
            db.cliente.count({ where }),
            db.cliente.findMany({
                where,
                skip: 0,
                take: 10,
                include: { categoria: true, plan: true },
                orderBy: { id: 'desc' }
            })
        ]);
        const tEnd = performance.now();
        return {
            duracionMs: tEnd - tStart,
            atrasadosCount: clientesAtrasados.length,
            morososResultantes: total
        };
    }

    const resCtrlVieja = await simularGetClientesMorosos(prismaVieja, asegurarVieja);
    console.log(`⏱️  Solapa Morosos (Versión Vieja): ${resCtrlVieja.duracionMs.toFixed(2)} ms (${resCtrlVieja.atrasadosCount} evaluados, ${resCtrlVieja.morososResultantes} morosos en lista)`);

    const resCtrlNueva = await simularGetClientesMorosos(prismaNueva, asegurarNueva);
    console.log(`⏱️  Solapa Morosos (Versión Nueva): ${resCtrlNueva.duracionMs.toFixed(2)} ms (${resCtrlNueva.atrasadosCount} evaluados, ${resCtrlNueva.morososResultantes} morosos en lista)`);

    await prismaVieja.$disconnect();
    await prismaNueva.$disconnect();
}

benchmark().catch(console.error);
