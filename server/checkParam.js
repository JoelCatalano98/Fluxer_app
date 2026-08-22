const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const param = await prisma.parametroSistema.findUnique({where: {clave: 'libroDiarioHabilitado'}});
  console.log(param);
}
check().finally(() => prisma.$disconnect());
