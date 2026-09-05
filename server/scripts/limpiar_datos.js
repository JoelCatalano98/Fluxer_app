const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearData() {
  try {
    console.log('Iniciando limpieza de datos de prueba...');

    // 1. Eliminar datos relacionados para evitar errores de Foreign Key
    console.log('Eliminando turnos y pagos asociados...');
    await prisma.turnoCliente.deleteMany({});
    await prisma.movimientoGeneral.deleteMany({});
    await prisma.movimientocuenta.deleteMany({});
    await prisma.pago.deleteMany({});
    await prisma.rutina.deleteMany({});
    await prisma.record.deleteMany({});

    // 2. Eliminar Clientes
    const clientes = await prisma.cliente.deleteMany({});
    console.log(`✅ Clientes eliminados: ${clientes.count}`);

    // 3. Eliminar Profesionales
    const profesionales = await prisma.profesional.deleteMany({});
    console.log(`✅ Profesionales eliminados: ${profesionales.count}`);

    console.log('✨ Limpieza completada con éxito. La base de datos está lista para producción.');
  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
