const prisma = require('../src/config/prisma');

async function main() {
  const planes = await prisma.$queryRawUnsafe(`
    SELECT id, nombre, precio, activo FROM planes WHERE precio = 45000 OR precio = 45000.00
  `);
  console.log('PLANES DE 45000:', planes);

  const todosLosPlanes = await prisma.$queryRawUnsafe(`
    SELECT id, nombre, precio FROM planes ORDER BY id ASC
  `);
  console.log('TODOS LOS PLANES:', todosLosPlanes);
}

main().catch(console.error).finally(() => prisma.$disconnect());
