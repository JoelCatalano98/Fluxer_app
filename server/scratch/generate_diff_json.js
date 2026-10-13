const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });
const { runVieja, runNueva, finDelDiaArgentina } = require('./test_diferencial_helpers');

async function generateReport() {
  const config = await prisma.configuracion.findFirst();
  const clientes = await prisma.cliente.findMany({
    include: {
      plan: true,
      movimientocuenta: { orderBy: { fecha: 'asc' } }
    },
    orderBy: { id: 'asc' }
  });

  const fechaSimulada = new Date('2026-11-12T12:00:00Z');
  const vencimiento10Nov = new Date('2026-11-10T00:00:00.000Z');

  const diffs = [];

  for (const c of clientes) {
    const resV = runVieja(c, config, fechaSimulada, vencimiento10Nov);
    const resN = runNueva(c, config, fechaSimulada, vencimiento10Nov);

    const cv = resV.nuevosMovimientos.filter(m => m.tipo === 'CARGO');
    const cn = resN.nuevosMovimientos.filter(m => m.tipo === 'CARGO');
    const rv = resV.nuevosMovimientos.filter(m => m.tipo === 'RECARGO');
    const rn = resN.nuevosMovimientos.filter(m => m.tipo === 'RECARGO');

    const cargosIguales = JSON.stringify(cv.map(m => ({ m: m.monto, d: m.descripcion }))) ===
                          JSON.stringify(cn.map(m => ({ m: m.monto, d: m.descripcion })));

    const vencIgual = resV.nuevoVencimiento.toISOString() === resN.nuevoVencimiento.toISOString();

    const corteAr = finDelDiaArgentina(2026, 10, 10);
    let saldoAlCorte = 0;
    for (const mov of c.movimientocuenta) {
      if (new Date(mov.fecha) <= corteAr) {
        const monto = parseFloat(mov.monto);
        if (mov.tipo === 'CARGO' || mov.tipo === 'RECARGO') saldoAlCorte -= monto;
        else saldoAlCorte += monto;
      }
    }

    const cuota = c.plan ? parseFloat(c.plan.precio) : 0;
    const cubrioCuota = saldoAlCorte >= cuota;

    diffs.push({
      id: c.id,
      alumno: `${c.nombre} ${c.apellido}`.trim(),
      cuota,
      saldoAlCorte,
      cubrioCuota,
      cargosVieja: cv.length,
      cargosNueva: cn.length,
      cargosIguales,
      recargosVieja: rv.length,
      recargosNueva: rn.length,
      montoRecargoVieja: rv.reduce((a, b) => a + b.monto, 0),
      montoRecargoNueva: rn.reduce((a, b) => a + b.monto, 0),
      vencIgual,
      saldoVieja: resV.nuevoSaldo,
      saldoNueva: resN.nuevoSaldo,
      estadoVieja: resV.nuevoEstadoPago,
      estadoNueva: resN.nuevoEstadoPago,
      vencVieja: resV.nuevoVencimiento.toISOString(),
      vencNueva: resN.nuevoVencimiento.toISOString()
    });
  }

  const clientesEvitan = diffs.filter(d => d.recargosVieja > 0 && d.recargosNueva === 0);
  console.log(JSON.stringify(clientesEvitan, null, 2));
}

generateReport().catch(console.error).finally(() => prisma.$disconnect());
