const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDB() {
    try {
        console.log("Iniciando limpieza de la base de datos...");
        
        // 1. Primero borramos los turnos (reservas) que dependen de los horarios
        const turnosBorrados = await prisma.turnoCliente.deleteMany({});
        console.log(`Tabla de turnos_clientes limpiada con éxito. Registros eliminados: ${turnosBorrados.count}`);

        // 2. Luego borramos los horarios
        const horariosBorrados = await prisma.horarioConfig.deleteMany({});
        console.log(`Tabla de horarios_config limpiada con éxito. Registros eliminados: ${horariosBorrados.count}`);
        
        console.log("¡Limpieza completa!");
    } catch (error) {
        console.error("Error al limpiar la tabla:", error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanDB();
