const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });

const { runVieja, runNueva } = require('./test_diferencial_helpers');

async function check52() {
  const config = await prisma.configuracion.findFirst();
  const clientes = await prisma.cliente.findMany({
    where: {
      vencimientoCuota: {
        gte: new Date('2026-11-10T00:00:00.000Z'),
        lt: new Date('2026-11-11T00:00:00.000Z')
      }
    },
    include: {
      plan: true,
      movimientocuenta: { orderBy: { fecha: 'asc' } }
    },
    orderBy: { id: 'asc' }
  });

  console.log(`Clientes con vencimiento actual al 10/11 en DB: ${clientes.length}`);
  const fechaSimulada = new Date('2026-11-12T12:00:00Z');

  const diffs = [];
  for (const c of clientes) {
    const resV = runVieja(c, config, fechaSimulada);
    const resN = runNueva(c, config, fechaSimulada);

    const cv = resV.nuevosMovimientos.filter(m => m.tipo === 'CARGO');
    const cn = resN.nuevosMovimientos.filter(m => m.tipo === 'CARGO');
    const rv = resV.nuevosMovimientos.filter(m => m.tipo === 'RECARGO');
    const rn = resN.nuevosMovimientos.filter(m => m.tipo === 'RECARGO');

    diffs.push({
      id: c.id,
      alumno: `${c.nombre} ${c.apellido}`.trim(),
      cuota: c.plan ? c.plan.precio : 0,
      cargosVieja: cv.length,
      cargosNueva: cn.length,
      recargosVieja: rv.length,
      recargosNueva: rn.length,
      saldoVieja: resV.nuevoSaldo,
      saldoNueva: resN.nuevoSaldo,
      estadoVieja: resV.nuevoEstadoPago,
      estadoNueva: resN.nuevoEstadoPago,
      vencVieja: resV.nuevoVencimiento.toISOString(),
      vencNueva: resN.nuevoVencimiento.toISOString()
    });
  }

  const evitanRecargo = diffs.filter(d => d.recargosVieja > 0 && d.recargosNueva === 0);
  const recargoAmbas = diffs.filter(d => d.recargosVieja > 0 && d.recargosNueva > 0);

  console.log(`- Total evaluados: ${diffs.length}`);
  console.log(`- Nueva evita recargo: ${evitanRecargo.length}`);
  console.log(`- Ambas generan recargo: ${recargoAmbas.length}`);
  console.table(evitanRecargo);
}

check52().catch(console.error).finally(() => prisma.$disconnect());
