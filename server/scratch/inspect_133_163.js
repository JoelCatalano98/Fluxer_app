const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });

async function main() {
    const ids = [133, 163];
    for (const id of ids) {
        const c = await prisma.cliente.findUnique({
            where: { id },
            include: {
                plan: true,
                movimientocuenta: { orderBy: { fecha: 'asc' } },
                pago: true
            }
        });
        console.log(`\n=== CLIENTE ${id} (${c.nombre} ${c.apellido}) ===`);
        console.log(`Saldo: $${c.saldo} | Estado Pago: ${c.estado_pago} | Estado Cliente: ${c.estado_cliente} | Vencimiento: ${c.vencimientoCuota?.toISOString()}`);
        console.log(`Plan: ${c.plan?.nombre} ($${c.plan?.precio}) | BranchId: ${c.branchId}`);
        console.log("Movimientos en cuenta:");
        console.table(c.movimientocuenta.map(m => ({
            id: m.id,
            tipo: m.tipo,
            monto: m.monto,
            desc: m.descripcion,
            fecha: m.fecha.toISOString()
        })));
        console.log("Pagos:");
        console.table(c.pago.map(p => ({
            id: p.id,
            monto: p.monto,
            estado: p.estado,
            concepto: p.concepto,
            fecha: p.fecha.toISOString()
        })));
    }
    await prisma.$disconnect();
}

main().catch(console.error);
