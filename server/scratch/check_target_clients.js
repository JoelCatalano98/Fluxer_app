const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });

async function check() {
  const ids = [11, 52, 43, 194, 114];
  for (const id of ids) {
    const movs = await prisma.movimientocuenta.findMany({ where: { clienteId: id }, orderBy: { fecha: 'asc' } });
    console.log(`=== MOVIMIENTOS CLIENTE ${id} ===`);
    console.table(movs.map(m => ({ id: m.id, tipo: m.tipo, monto: m.monto, desc: m.descripcion, fecha: m.fecha.toISOString() })));
    const c = await prisma.cliente.findUnique({ where: { id } });
    console.log(`Cliente ${id} saldo:`, c.saldo, "estado:", c.estado_pago);
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
