const prisma = require('./src/config/prisma');

async function addIndex() {
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE turnos_clientes ADD UNIQUE INDEX turnos_clientes_fecha_horarioId_clienteId_estado_key (fecha, horarioId, clienteId, estado);`);
        console.log("Index added successfully.");
    } catch (e) {
        console.error(e);
    }
}
addIndex().then(() => process.exit(0));
