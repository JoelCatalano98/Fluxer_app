const prisma = require('../src/config/prisma');

async function main() {
  const turnos74 = await prisma.$queryRawUnsafe('SELECT * FROM turnos_clientes WHERE clienteId = 74');
  console.log('TURNOS CLIENTE 74:', turnos74);

  const turnos7 = await prisma.$queryRawUnsafe('SELECT * FROM turnos_clientes WHERE clienteId = 7');
  console.log('TURNOS CLIENTE 7:', turnos7);

  const client74 = await prisma.cliente.findUnique({
    where: { id: 74 },
    include: { plan: true, clienteCategorias: true }
  });
  console.log('CLIENTE 74 COMPLETO:', client74);

  // Ver fechas de esta semana
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const diffLunes = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
  const lunes = new Date(hoy);
  lunes.setDate(diffLunes);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  
  const lunesStr = lunes.toISOString().split('T')[0];
  const domingoStr = domingo.toISOString().split('T')[0];
  console.log(`LUNES: ${lunesStr}, DOMINGO: ${domingoStr}`);

  const countQuery = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM turnos_clientes WHERE clienteId = 74 AND fecha BETWEEN '${lunesStr}' AND '${domingoStr}'`);
  console.log('QUERY 3 RESULT CLIENTE 74:', countQuery);
}

main().catch(console.error).finally(() => prisma.$disconnect());
