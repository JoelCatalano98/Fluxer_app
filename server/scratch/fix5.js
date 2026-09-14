const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rutinas = await prisma.rutinaLibro.findMany();
  console.log("RutinasLibro:", JSON.stringify(rutinas, null, 2));
}

main().finally(() => prisma.$disconnect());
