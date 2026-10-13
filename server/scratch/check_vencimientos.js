const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });

async function check() {
  const recargos = await prisma.movimientocuenta.findMany({
    where: { tipo: 'RECARGO', descripcion: { contains: '10/2026' } },
    include: { cliente: true }
  });
  console.table(recargos.map(r => ({
    clienteId: r.cliente.id,
    nombre: `${r.cliente.nombre} ${r.cliente.apellido}`,
    vencimientoCuota: r.cliente.vencimientoCuota ? r.cliente.vencimientoCuota.toISOString() : null,
    saldo: r.cliente.saldo,
    estado_pago: r.cliente.estado_pago
  })));
}

check().catch(console.error).finally(() => prisma.$disconnect());
