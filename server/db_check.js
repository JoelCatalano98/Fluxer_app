const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const clientes = await prisma.cliente.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        select: { id: true, nombre: true, apellido: true, estado_cliente: true }
    });
    console.log(clientes);
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect(); });
