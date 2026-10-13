const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });

const { runVieja, runNueva } = require('./test_diferencial_helpers');

async function checkAllAsIs() {
  const config = await prisma.configuracion.findFirst();
  const clientes = await prisma.cliente.findMany({
    include: {
      plan: true,
      movimientocuenta: { orderBy: { fecha: 'asc' } }
    },
    orderBy: { id: 'asc' }
  });

  console.log(`Total clientes: ${clientes.length}`);
  const fechaSimulada = new Date('2026-11-12T12:00:00Z');

  const diffs = [];
  for (const c of clientes) {
    const resV = runVieja(c, config, fechaSimulada);
    const resN = runNueva(c, config, fechaSimulada);

    const cv = resV.nuevosMovimientos.filter(m => m.tipo === 'CARGO');
    const cn = resN.nuevosMovimientos.filter(m => m.tipo === 'CARGO');
    const rv = resV.nuevosMovimientos.filter(m => m.tipo === 'RECARGO');
    const rn = resN.nuevosMovimientos.filter(m => m.tipo === 'RECARGO');

    const cargosIguales = JSON.stringify(cv.map(m => ({ m: m.monto, d: m.descripcion }))) ===
                          JSON.stringify(cn.map(m => ({ m: m.monto, d: m.descripcion })));
    const vencIgual = resV.nuevoVencimiento.toISOString() === resN.nuevoVencimiento.toISOString();

    diffs.push({
      id: c.id,
      alumno: `${c.nombre} ${c.apellido}`.trim(),
      vencInicial: c.vencimientoCuota ? c.vencimientoCuota.toISOString().slice(0, 10) : 'NULL',
      cuota: c.plan ? c.plan.precio : 0,
      cargosVieja: cv.length,
      cargosNueva: cn.length,
      cargosIguales,
      recargosVieja: rv.length,
      recargosNueva: rn.length,
      vencIgual,
      saldoVieja: resV.nuevoSaldo,
      saldoNueva: resN.nuevoSaldo,
      estadoVieja: resV.nuevoEstadoPago,
      estadoNueva: resN.nuevoEstadoPago,
      vencVieja: resV.nuevoVencimiento.toISOString().slice(0, 10),
      vencNueva: resN.nuevoVencimiento.toISOString().slice(0, 10),
      recargosEvitados: rv.length - rn.length
    });
  }

  const conCargosDistintos = diffs.filter(d => !d.cargosIguales);
  const conVencDistintos = diffs.filter(d => !d.vencIgual);
  const evitados = diffs.filter(d => d.recargosEvitados > 0);

  console.log(`- CARGOs distintos: ${conCargosDistintos.length}`);
  console.log(`- Vencimientos distintos: ${conVencDistintos.length}`);
  console.log(`- Clientes donde Nueva evita al menos 1 recargo: ${evitados.length}`);
  console.log(`- Total recargos evitados en la base: ${diffs.reduce((a, b) => a + b.recargosEvitados, 0)}`);
}

checkAllAsIs().catch(console.error).finally(() => prisma.$disconnect());
