const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const cats = await prisma.categoria.findMany();
  console.log(cats);
  await prisma.$disconnect();
}
run().catch(console.error);
