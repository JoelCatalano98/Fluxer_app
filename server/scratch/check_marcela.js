const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });

async function check() {
  const movs = await prisma.movimientocuenta.findMany({ where: { clienteId: 194 }, orderBy: { fecha: 'asc' } });
  console.log("=== MOVIMIENTOS MARCELA VITALE (194) ===");
  console.table(movs.map(m => ({ id: m.id, tipo: m.tipo, monto: m.monto, desc: m.descripcion, fecha: m.fecha.toISOString() })));

  const c = await prisma.cliente.findUnique({ where: { id: 194 } });
  console.log("Cliente 194 saldo actual:", c.saldo, "estado:", c.estado_pago);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
