require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Timezone Offset:", new Date().getTimezoneOffset());
    const c = await prisma.cliente.findFirst({ where: { id: 36 } });
    console.log("c.vencimientoCuota:", c.vencimientoCuota);
    console.log("toISOString:", c.vencimientoCuota.toISOString());
    console.log("getDate:", c.vencimientoCuota.getDate());
    console.log("getUTCDate:", c.vencimientoCuota.getUTCDate());
    console.log("getFullYear:", c.vencimientoCuota.getFullYear());
    console.log("getUTCFullYear:", c.vencimientoCuota.getUTCFullYear());
    const rows = await prisma.$queryRaw`SELECT * FROM clientes WHERE id = 36`;
    console.log("queryRaw vencimientoCuota:", rows[0].vencimientoCuota);
    console.log("queryRaw getDate:", rows[0].vencimientoCuota.getDate());
    console.log("queryRaw getUTCDate:", rows[0].vencimientoCuota.getUTCDate());
    await prisma.$disconnect();
}

main().catch(console.error);
