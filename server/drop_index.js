const prisma = require('./src/config/prisma');

async function dropIndex() {
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE turnos_clientes DROP INDEX turnos_clientes_fecha_horarioId_clienteId_key;`);
        console.log("Index dropped successfully.");
    } catch (e) {
        console.error(e);
    }
}
dropIndex().then(() => process.exit(0));
