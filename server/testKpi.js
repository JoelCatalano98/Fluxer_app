const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const totalActivos = await prisma.cliente.count({ where: { estado_cliente: 'ACTIVO' } });
  const totalSocios = await prisma.cliente.count({ where: { estado_cliente: 'ACTIVO', es_socio: true } });
  console.log('Activos:', totalActivos, 'Socios:', totalSocios);
  await prisma.$disconnect();
}
run().catch(console.error);
