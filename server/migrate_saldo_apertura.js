const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log("Iniciando migración de saldos de apertura...");

    const clientes = await prisma.cliente.findMany({
        where: { saldo: { not: 0 } }
    });

    console.log(`Encontrados ${clientes.length} clientes con saldo distinto de 0.`);
    let ajustados = 0;

    for (const cliente of clientes) {
        const montoAjuste = -cliente.saldo;
        
        console.log(`Cliente ${cliente.id} (${cliente.nombre} ${cliente.apellido}): Saldo actual ${cliente.saldo} -> Ajuste de ${montoAjuste}`);

        await prisma.movimientoCuenta.create({
            data: {
                monto: montoAjuste,
                tipo: 'AJUSTE',
                descripcion: 'Ajuste de apertura - migración a sistema de cargos',
                clienteId: cliente.id
            }
        });

        await prisma.cliente.update({
            where: { id: cliente.id },
            data: { saldo: 0 }
        });
        
        ajustados++;
    }

    console.log(`Migración completada. ${ajustados} clientes ajustados.`);
    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
