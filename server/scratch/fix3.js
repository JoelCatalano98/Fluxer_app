const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rutinas = await prisma.rutina.findMany({ where: { clienteId: 11 } });
  console.log("OLD RUTINAS (Rutina):", JSON.stringify(rutinas, null, 2));

  const asigs = await prisma.asignacionRutinaLibro.findMany({ where: { clienteId: 11 }, include: { rutinaLibro: true } });
  console.log("NEW RUTINAS (AsignacionRutinaLibro):", JSON.stringify(asigs, null, 2));
}

main().finally(() => prisma.$disconnect());
