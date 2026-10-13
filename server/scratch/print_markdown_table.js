const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });
const { runVieja, runNueva, finDelDiaArgentina } = require('./test_diferencial_helpers');

async function printMarkdownTable() {
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

  const evitados = [];

  for (const c of clientes) {
    const resV = runVieja(c, config, fechaSimulada, vencimiento10Nov);
    const resN = runNueva(c, config, fechaSimulada, vencimiento10Nov);

    const rv = resV.nuevosMovimientos.filter(m => m.tipo === 'RECARGO');
    const rn = resN.nuevosMovimientos.filter(m => m.tipo === 'RECARGO');

    if (rv.length > 0 && rn.length === 0) {
      const corteAr = finDelDiaArgentina(2026, 10, 10);
      let saldoAlCorte = 0;
      for (const mov of c.movimientocuenta) {
        if (new Date(mov.fecha) <= corteAr) {
          const monto = parseFloat(mov.monto);
          if (mov.tipo === 'CARGO' || mov.tipo === 'RECARGO') saldoAlCorte -= monto;
          else saldoAlCorte += monto;
        }
      }

      evitados.push({
        id: c.id,
        alumno: `${c.nombre} ${c.apellido}`.trim(),
        cuota: c.plan ? parseFloat(c.plan.precio) : 0,
        saldoAlCorte,
        recargoVieja: rv[0].monto,
        saldoVieja: resV.nuevoSaldo,
        saldoNueva: resN.nuevoSaldo,
        estadoVieja: resV.nuevoEstadoPago,
        estadoNueva: resN.nuevoEstadoPago
      });
    }
  }

  console.log(`| # | ID | Alumno | Cuota 11/2026 | Saldo al Corte | Recargo Vieja | Recargo Nueva | Saldo Vieja | Saldo Nueva | Estado Vieja | Estado Nueva |`);
  console.log(`|---|---|---|---|---|---|---|---|---|---|---|`);
  evitados.forEach((e, idx) => {
    console.log(`| ${idx + 1} | ${e.id} | ${e.alumno} | $${e.cuota} | $${e.saldoAlCorte} | $${e.recargoVieja} | $0 | $${e.saldoVieja} | $${e.saldoNueva} | ${e.estadoVieja} | ${e.estadoNueva} |`);
  });
}

printMarkdownTable().catch(console.error).finally(() => prisma.$disconnect());
