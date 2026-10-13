const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });

async function main() {
    const lastMovs = await prisma.movimientocuenta.findMany({ orderBy: { id: 'desc' }, take: 10 });
    console.log("Últimos movimientos en fluxer_auditoria:");
    console.log(lastMovs);

    const mov820 = await prisma.movimientocuenta.findUnique({ where: { id: 820 } });
    console.log("Movimiento 820:", mov820);

    await prisma.$disconnect();
}

main().catch(console.error);
