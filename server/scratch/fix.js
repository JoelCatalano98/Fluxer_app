const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const asigs = await prisma.asignacionRutinaLibro.findMany({ 
    include: { 
      cliente: true, 
      rutinaLibro: { include: { fases: true } } 
    } 
  }); 
  console.log(JSON.stringify(asigs.filter(a => a.cliente.nombre.toLowerCase().includes('tomas')), null, 2));
}

main().finally(() => prisma.$disconnect());
