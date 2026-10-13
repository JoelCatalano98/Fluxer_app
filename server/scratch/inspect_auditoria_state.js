const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });

async function check() {
    const totalClientes = await prisma.cliente.count();
    const totalMovs = await prisma.movimientocuenta.count();
    
    // Check if there are bonificaciones or adjustments
    const bonifs = await prisma.movimientocuenta.count({ where: { tipo: 'BONIFICACION' } });
    const recargos = await prisma.movimientocuenta.count({ where: { tipo: 'RECARGO' } });
    const cargos = await prisma.movimientocuenta.count({ where: { tipo: 'CARGO' } });
    
    // Check sample client 11 (Santi Perez)
    const c11 = await prisma.cliente.findUnique({
        where: { id: 11 },
        include: { movimientocuenta: { orderBy: { fecha: 'asc' } } }
    });

    console.log({
        totalClientes,
        totalMovs,
        bonifs,
        recargos,
        cargos,
        c11_saldo: c11.saldo,
        c11_movs: c11.movimientocuenta.map(m => ({ id: m.id, tipo: m.tipo, monto: m.monto, desc: m.descripcion, fecha: m.fecha }))
    });

    await prisma.$disconnect();
}

check().catch(console.error);
