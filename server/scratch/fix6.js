const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rutinas = await prisma.rutina.findMany({ where: { clienteId: null } });
  console.log("Global Old Rutinas:", JSON.stringify(rutinas, null, 2));
}

main().finally(() => prisma.$disconnect());
