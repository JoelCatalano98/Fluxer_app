const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addParam() {
  await prisma.parametroSistema.upsert({
    where: { clave: 'asignacionMasivaHabilitado' },
    update: {},
    create: {
      clave: 'asignacionMasivaHabilitado',
      descripcion: 'Habilitar la pantalla de asignación masiva de turnos mensuales',
      tipo: 'boolean',
      valor: 'true'
    }
  });
  console.log("Parametro añadido/verificado exitosamente.");
}

addParam().catch(console.error).finally(() => prisma.$disconnect());
