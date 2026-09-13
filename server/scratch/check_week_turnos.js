const prisma = require('../src/config/prisma');

async function main() {
  const turnos = await prisma.$queryRawUnsafe(`
    SELECT id, fecha, horarioId, clienteId, estado, branchId 
    FROM turnos_clientes 
    WHERE clienteId = 74 AND fecha BETWEEN '2026-09-14' AND '2026-09-20'
  `);
  console.log('TURNOS CLIENTE 74 EN ESA SEMANA:', turnos);

  const countQuery = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as total 
    FROM turnos_clientes 
    WHERE clienteId = 74 AND fecha BETWEEN '2026-09-14' AND '2026-09-20'
  `);
  console.log('COUNT QUERY EXACTA:', countQuery);
}

main().catch(console.error).finally(() => prisma.$disconnect());
