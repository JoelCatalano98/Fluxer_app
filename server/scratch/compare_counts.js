const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });

async function analyze() {
    const clientes = await prisma.cliente.findMany({
        include: {
            plan: true,
            movimientocuenta: { orderBy: { fecha: 'asc' } }
        },
        orderBy: { id: 'asc' }
    });

    console.log("Total clientes:", clientes.length);

    // Corte: fin del día 10/11 en Argentina: 2026-11-11T02:59:59.999Z
    const corteAr = new Date(Date.UTC(2026, 10, 10, 26, 59, 59, 999));
    console.log("Corte AR:", corteAr.toISOString());

    let cubrenSinRecargo10 = 0;
    let cubrenConRecargo10 = 0;

    const listaCubren = [];

    for (const c of clientes) {
        const cuota = c.plan ? parseFloat(c.plan.precio) : 0;
        
        // 1. Saldo al corte considerando TODOS los movimientos existentes en la base actual
        let saldoAlCorteActual = 0;
        let saldoAlCorteExcluyendoRecargo10 = 0;
        let tieneRecargo10 = false;
        let montoRecargo10 = 0;

        for (const m of c.movimientocuenta) {
            if (new Date(m.fecha) <= corteAr) {
                const monto = parseFloat(m.monto);
                const esRecargo10 = m.tipo === 'RECARGO' && (m.descripcion.includes('10/2026') || m.fecha.toISOString().startsWith('2026-10'));
                if (esRecargo10) {
                    tieneRecargo10 = true;
                    montoRecargo10 += monto;
                }

                if (m.tipo === 'CARGO' || m.tipo === 'RECARGO') {
                    saldoAlCorteActual -= monto;
                    if (!esRecargo10) saldoAlCorteExcluyendoRecargo10 -= monto;
                } else {
                    saldoAlCorteActual += monto;
                    saldoAlCorteExcluyendoRecargo10 += monto;
                }
            }
        }

        const cubreConEstadoActual = saldoAlCorteActual >= cuota;
        const cubreExcluyendoRecargo10 = saldoAlCorteExcluyendoRecargo10 >= cuota;

        if (cubreConEstadoActual) cubrenConRecargo10++;
        if (cubreExcluyendoRecargo10) {
            cubrenSinRecargo10++;
            listaCubren.push({
                id: c.id,
                nombre: `${c.nombre} ${c.apellido}`,
                cuota,
                saldoActual: c.saldo,
                saldoAlCorteActual,
                saldoAlCorteSinRecargo10: saldoAlCorteExcluyendoRecargo10,
                tieneRecargo10,
                cubreConEstadoActual,
                cubreExcluyendoRecargo10
            });
        }
    }

    console.log(`Clientes que cubren la cuota con estado actual (incluyendo recargo 10/2026 si existe): ${cubrenConRecargo10}`);
    console.log(`Clientes que cubren la cuota excluyendo recargo de 10/2026: ${cubrenSinRecargo10}`);

    // Check how many have payments in October
    const clientesConPagoOctubre = clientes.filter(c => 
        c.movimientocuenta.some(m => (m.tipo === 'INGRESO' || m.tipo === 'PAGO') && m.fecha >= new Date('2026-10-01T00:00:00Z'))
    );
    console.log(`Clientes con pagos en octubre: ${clientesConPagoOctubre.length}`);

    await prisma.$disconnect();
}

analyze().catch(console.error);
