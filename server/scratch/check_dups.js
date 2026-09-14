const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const dups = await prisma.$queryRaw`
        SELECT clave, branchId, COUNT(*) as count 
        FROM parametros_sistema 
        GROUP BY clave, branchId 
        HAVING COUNT(*) > 1
    `;
    console.log("Duplicados encontrados:", dups);
}

main().catch(console.error).finally(() => prisma.$disconnect());
