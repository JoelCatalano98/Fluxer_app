const prisma = require('../src/config/prisma');

async function main() {
  const turnos73 = await prisma.$queryRawUnsafe(`
    SELECT tc.id, tc.fecha, tc.horarioId, tc.clienteId, tc.estado,
           hc.hora_inicio, hc.hora_fin, hc.dia_semana, hc.categoriaId as horario_categoriaId,
           cat.nombre as categoria_nombre
    FROM turnos_clientes tc
    JOIN horarios_config hc ON tc.horarioId = hc.id
    LEFT JOIN categorias cat ON hc.categoriaId = cat.id
    WHERE tc.clienteId = 73
    ORDER BY tc.fecha ASC, hc.hora_inicio ASC
  `);
  console.log('TODOS LOS TURNOS DE MILAGROS (CLIENTE 73):');
  console.table(turnos73);
}

main().catch(console.error).finally(() => prisma.$disconnect());
