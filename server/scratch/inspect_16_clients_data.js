const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });

async function check() {
  const recargos = await prisma.movimientocuenta.findMany({
    where: { tipo: 'RECARGO', descripcion: { contains: '10/2026' } },
    include: { cliente: { include: { plan: true, movimientocuenta: { orderBy: { fecha: 'asc' } } } } }
  });
  console.log(`Encontrados ${recargos.length} recargos.`);
  for (const r of recargos) {
    const c = r.cliente;
    const cargoOct = c.movimientocuenta.find(m => m.tipo === 'CARGO' && m.descripcion.includes('10/2026'));
    const cuota = cargoOct ? cargoOct.monto : (c.plan?.precio || 0);
    const pagosOct = c.movimientocuenta.filter(m => (m.tipo === 'INGRESO' || m.tipo === 'PAGO') && m.fecha >= new Date('2026-10-01T00:00:00.000Z') && m.fecha <= new Date('2026-10-31T23:59:59.999Z'));
    
    // saldo_al_corte (corte 2026-10-11T02:59:59.999Z)
    const corte = new Date('2026-10-11T02:59:59.999Z');
    let saldoAlCorte = 0;
    c.movimientocuenta.forEach(m => {
      if (m.fecha <= corte) {
        if (m.tipo === 'CARGO' && m.descripcion.includes('10/2026')) return;
        if (m.tipo === 'RECARGO' && m.descripcion.includes('10/2026')) return;
        if (m.tipo === 'CARGO' || m.tipo === 'RECARGO') saldoAlCorte -= m.monto;
        else saldoAlCorte += m.monto;
      }
    });

    console.log(JSON.stringify({
      id: c.id,
      nombre: `${c.nombre} ${c.apellido}`,
      recargoId: r.id,
      recargoMonto: r.monto,
      cuota,
      saldoActual: c.saldo,
      saldoAlCorte,
      cantPagosOct: pagosOct.length,
      pagosOct: pagosOct.map(p => `${p.monto} (${p.fecha.toISOString()})`)
    }));
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
