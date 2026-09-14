const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const asigs = await prisma.asignacionRutinaLibro.findMany({ 
    where: { estado: 'activa' },
    include: { 
      rutinaLibro: { include: { fases: { orderBy: { orden: 'asc' } } } } 
    } 
  }); 

  let fixedCount = 0;
  for (const asig of asigs) {
    const validPhaseIds = asig.rutinaLibro.fases.map(f => f.id);
    if (asig.faseActualId === null || !validPhaseIds.includes(asig.faseActualId)) {
        if (asig.rutinaLibro.fases.length > 0) {
            await prisma.asignacionRutinaLibro.update({
                where: { id: asig.id },
                data: { faseActualId: asig.rutinaLibro.fases[0].id }
            });
            fixedCount++;
        }
    }
  }
  console.log(`Se arreglaron ${fixedCount} asignaciones rotas.`);
}

main().finally(() => prisma.$disconnect());
