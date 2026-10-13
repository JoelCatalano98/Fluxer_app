const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });

async function checkExtra() {
    const extra = await prisma.movimientocuenta.findMany({
        where: { id: { gt: 583 } },
        orderBy: { id: 'asc' }
    });
    console.log("Cantidad de movimientos con id > 583:", extra.length);
    console.log("Muestra de los primeros 5:", extra.slice(0, 5));
    console.log("Muestra de los últimos 5:", extra.slice(-5));

    // Distribution by description
    const descCounts = {};
    for (const m of extra) {
        descCounts[m.descripcion] = (descCounts[m.descripcion] || 0) + 1;
    }
    console.log("Distribución por descripción:", descCounts);

    await prisma.$disconnect();
}

checkExtra().catch(console.error);
