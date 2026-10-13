const { PrismaClient } = require('@prisma/client');

// Prisma instances for both test DBs
const prismaVieja = new PrismaClient({
    datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_test_vieja' } }
});

const prismaNueva = new PrismaClient({
    datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_test_nueva' } }
});

async function main() {
    console.log("================================================================================");
    console.log("=== TEST DIFERENCIAL REAL CON BASES CLONADAS Y CÓDIGO REAL DE HEAD VS ACTUAL ===");
    console.log("================================================================================\n");

    // 1. Preparar ambas bases con vencimientos al 10/11
    console.log("⚙️  Actualizando vencimientos al 10/11 en ambas bases...");
    await prismaVieja.$executeRawUnsafe(`UPDATE clientes SET vencimientoCuota = '2026-11-10 00:00:00'`);
    await prismaNueva.$executeRawUnsafe(`UPDATE clientes SET vencimientoCuota = '2026-11-10 00:00:00'`);

    const clientes = await prismaVieja.cliente.findMany({
        select: { id: true, nombre: true, apellido: true },
        orderBy: { id: 'asc' }
    });
    console.log(`📋 Total de clientes a procesar: ${clientes.length}\n`);

    // Guardar conteo previo de movimientos
    const movsPrevVieja = await prismaVieja.movimientocuenta.count();
    const movsPrevNueva = await prismaNueva.movimientocuenta.count();

    // 2. Ejecutar VERSIÓN VIEJA REAL (desde git HEAD) sobre fluxer_test_vieja
    console.log("⏳ Ejecutando VERSIÓN VIEJA REAL (git HEAD) sobre fluxer_test_vieja (215 clientes)...");
    process.env.DATABASE_URL = 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_test_vieja';
    
    // Limpiar require cache para que el singleton de prisma apunte a fluxer_test_vieja
    delete require.cache[require.resolve('../src/config/prisma')];
    delete require.cache[require.resolve('./cargos.service.HEAD')];
    const { asegurarCargosAlDia: asegurarVieja } = require('./cargos.service.HEAD');

    // Mock Date para que new Date() sea 2026-11-12T12:00:00Z
    const RealDate = Date;
    const SIMULATED_TIME = new RealDate('2026-11-12T12:00:00Z').getTime();

    class MockDate extends RealDate {
        constructor(...args) {
            if (args.length === 0) {
                super(SIMULATED_TIME);
            } else {
                super(...args);
            }
        }
        static now() {
            return SIMULATED_TIME;
        }
    }
    global.Date = MockDate;

    const t0Vieja = Date.now();
    for (const c of clientes) {
        await asegurarVieja(c.id);
    }
    const durVieja = RealDate.now() - t0Vieja;
    console.log(`✅ Versión vieja finalizada en ${durVieja}ms.\n`);

    // Restaurar Date real
    global.Date = RealDate;

    // 3. Ejecutar VERSIÓN NUEVA REAL (árbol de trabajo actual) sobre fluxer_test_nueva
    console.log("⏳ Ejecutando VERSIÓN NUEVA REAL (árbol de trabajo) sobre fluxer_test_nueva (215 clientes)...");
    process.env.DATABASE_URL = 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_test_nueva';

    delete require.cache[require.resolve('../src/config/prisma')];
    delete require.cache[require.resolve('../src/services/cargos.service')];
    const { asegurarCargosAlDia: asegurarNueva } = require('../src/services/cargos.service');

    const t0Nueva = Date.now();
    for (const c of clientes) {
        await asegurarNueva(c.id, { fechaSimulada: '2026-11-12T12:00:00Z' });
    }
    const durNueva = Date.now() - t0Nueva;
    console.log(`✅ Versión nueva finalizada en ${durNueva}ms.\n`);

    // 4. Extraer y comparar resultados reales desde las bases de datos
    console.log("🔍 Comparando resultados extraídos directamente de las bases de datos...");

    const movsPostVieja = await prismaVieja.movimientocuenta.count();
    const movsPostNueva = await prismaNueva.movimientocuenta.count();
    console.log(`- Movimientos agregados en Vieja: ${movsPostVieja - movsPrevVieja}`);
    console.log(`- Movimientos agregados en Nueva: ${movsPostNueva - movsPrevNueva}`);

    const clientesVieja = await prismaVieja.cliente.findMany({
        include: {
            plan: true,
            movimientocuenta: { orderBy: { id: 'asc' } }
        },
        orderBy: { id: 'asc' }
    });

    const clientesNueva = await prismaNueva.cliente.findMany({
        include: {
            plan: true,
            movimientocuenta: { orderBy: { id: 'asc' } }
        },
        orderBy: { id: 'asc' }
    });

    const mapaNueva = new Map(clientesNueva.map(c => [c.id, c]));
    const diferencias = [];

    for (const cV of clientesVieja) {
        const cN = mapaNueva.get(cV.id);

        // Movimientos creados durante la corrida (los que tienen fecha o id posterior)
        const nuevosMovsVieja = cV.movimientocuenta.slice(cargosPrevCount(cV));
        const nuevosMovsNueva = cN.movimientocuenta.slice(cargosPrevCount(cN));

        const cargosV = cV.movimientocuenta.filter(m => m.tipo === 'CARGO' && m.descripcion.includes('11/2026'));
        const cargosN = cN.movimientocuenta.filter(m => m.tipo === 'CARGO' && m.descripcion.includes('11/2026'));
        const recargosV = cV.movimientocuenta.filter(m => m.tipo === 'RECARGO' && m.descripcion.includes('11/2026'));
        const recargosN = cN.movimientocuenta.filter(m => m.tipo === 'RECARGO' && m.descripcion.includes('11/2026'));

        const cargosIguales = JSON.stringify(cargosV.map(m => ({ m: m.monto, d: m.descripcion }))) ===
                              JSON.stringify(cargosN.map(m => ({ m: m.monto, d: m.descripcion })));

        const vencV = cV.vencimientoCuota ? cV.vencimientoCuota.toISOString() : null;
        const vencN = cN.vencimientoCuota ? cN.vencimientoCuota.toISOString() : null;
        const vencIgual = vencV === vencN;

        const saldoIgual = Math.abs(cV.saldo - cN.saldo) < 0.01;
        const estadoIgual = cV.estado_pago === cN.estado_pago;

        diferencias.push({
            id: cV.id,
            alumno: `${cV.nombre} ${cV.apellido}`.trim(),
            cuota: cV.plan ? parseFloat(cV.plan.precio) : 0,
            cargosVieja: cargosV.length,
            cargosNueva: cargosN.length,
            cargosIguales,
            recargosVieja: recargosV.length,
            recargosNueva: recargosN.length,
            recargosEvitados: recargosV.length - recargosN.length,
            vencIgual,
            saldoVieja: cV.saldo,
            saldoNueva: cN.saldo,
            estadoVieja: cV.estado_pago,
            estadoNueva: cN.estado_pago,
            vencVieja: vencV,
            vencNueva: vencN
        });
    }

    function cargosPrevCount(c) {
        // En ambas bases antes de correr la simulación, no existían movimientos de 11/2026
        return c.movimientocuenta.filter(m => !m.descripcion.includes('11/2026')).length;
    }

    const conCargosDistintos = diferencias.filter(d => !d.cargosIguales);
    const conVencDistintos = diferencias.filter(d => !d.vencIgual);
    const evitados = diferencias.filter(d => d.recargosEvitados > 0);
    const recargoAmbas = diferencias.filter(d => d.recargosVieja > 0 && d.recargosNueva > 0);

    console.log("\n================================================================================");
    console.log(`📊 REPORTE COMPARATIVO DE DATOS REALES EN BASE:`);
    console.log(`- Clientes evaluados:                                     ${diferencias.length}`);
    console.log(`- CARGOs distintos (Vieja vs Nueva):                      ${conCargosDistintos.length}`);
    console.log(`- Vencimientos finales distintos (Vieja vs Nueva):        ${conVencDistintos.length}`);
    console.log(`- Clientes donde la NUEVA EVITA el recargo (cubrieron):   ${evitados.length}`);
    console.log(`- Clientes donde AMBAS generan recargo (no cubrieron):    ${recargoAmbas.length}`);
    console.log("================================================================================");

    if (conCargosDistintos.length > 0) {
        console.error("❌ ANOMALÍA: Hay CARGOs distintos!");
        console.table(conCargosDistintos);
    }
    if (conVencDistintos.length > 0) {
        console.error("❌ ANOMALÍA: Hay vencimientos distintos!");
        console.table(conVencDistintos);
    }

    console.log("\n=== LISTA DE LOS 54 CLIENTES DONDE LA VERSIÓN NUEVA EVITÓ EL RECARGO ===");
    console.table(evitados.map(e => ({
        ID: e.id,
        Alumno: e.alumno,
        Cuota: e.cuota,
        'Recargos Vieja': e.recargosVieja,
        'Recargos Nueva': e.recargosNueva,
        'Saldo Vieja': e.saldoVieja,
        'Saldo Nueva': e.saldoNueva,
        'Estado Vieja': e.estadoVieja,
        'Estado Nueva': e.estadoNueva,
        'Vencimiento': e.vencNueva.slice(0, 10)
    })));
}

main()
    .catch(console.error)
    .finally(async () => {
        await prismaVieja.$disconnect();
        await prismaNueva.$disconnect();
    });
