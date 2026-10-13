const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });

async function inspect57() {
    const c57 = await prisma.cliente.findUnique({
        where: { id: 57 },
        include: { plan: true, movimientocuenta: { orderBy: { fecha: 'asc' } } }
    });
    console.log("Cliente 57:", {
        id: c57.id,
        nombre: c57.nombre,
        saldo: c57.saldo,
        vencimientoCuota: c57.vencimientoCuota,
        plan: c57.plan,
        movs: c57.movimientocuenta.map(m => ({ id: m.id, tipo: m.tipo, monto: m.monto, fecha: m.fecha, desc: m.descripcion }))
    });
    await prisma.$disconnect();
}

inspect57().catch(console.error);
