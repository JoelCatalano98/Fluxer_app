const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const ejercicio = await prisma.rutinaEjercicio.findUnique({
            where: { id: 14 },
            include: { rutina: true }
        });
        console.log("Ejercicio 14:", JSON.stringify(ejercicio, null, 2));

        const clientes = await prisma.cliente.findMany({
            where: { id: ejercicio?.rutina?.clienteId || undefined }
        });
        console.log("Cliente de la rutina:", JSON.stringify(clientes, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
