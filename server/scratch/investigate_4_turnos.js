const prisma = require('../src/config/prisma');

async function main() {
  const turnos = await prisma.$queryRawUnsafe(`
    SELECT tc.id, tc.fecha, tc.horarioId, tc.clienteId, tc.estado, tc.branchId,
           hc.hora_inicio, hc.hora_fin, hc.dia_semana, hc.categoriaId as horario_categoriaId,
           c.nombre as cliente_nombre, c.apellido as cliente_apellido, c.planId,
           cat.nombre as categoria_nombre
    FROM turnos_clientes tc
    JOIN horarios_config hc ON tc.horarioId = hc.id
    JOIN clientes c ON tc.clienteId = c.id
    LEFT JOIN categorias cat ON hc.categoriaId = cat.id
    WHERE tc.fecha BETWEEN '2026-09-14' AND '2026-09-20'
    ORDER BY tc.fecha ASC, hc.hora_inicio ASC
  `);
  console.log('TURNOS EN LA SEMANA 14-20 SEPTIEMBRE:');
  console.table(turnos);
}

main().catch(console.error).finally(() => prisma.$disconnect());
