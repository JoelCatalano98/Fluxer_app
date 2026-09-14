const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cat = await prisma.categoria.findUnique({ where: { id: 6 } });
  console.log("Categoria:", JSON.stringify(cat, null, 2));
}

main().finally(() => prisma.$disconnect());
