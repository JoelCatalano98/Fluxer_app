const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });

async function check() {
  const total = await prisma.cliente.count();
  const clientes = await prisma.cliente.findMany({
    select: { id: true, nombre: true, apellido: true, vencimientoCuota: true, planId: true, saldo: true, estado_pago: true }
  });
  console.log('Total clientes:', total);
  const dist = {};
  clientes.forEach(c => {
    const v = c.vencimientoCuota ? c.vencimientoCuota.toISOString().slice(0, 10) : 'NULL';
    dist[v] = (dist[v] || 0) + 1;
  });
  console.log('Distribución de vencimientos:', dist);
  const conPlan = clientes.filter(c => c.planId !== null);
  console.log('Clientes con plan:', conPlan.length);
}

check().catch(console.error).finally(() => prisma.$disconnect());
