const prisma = require('../src/config/prisma');

async function main() {
  // Ver clientes con plan normal de una sola disciplina y su saldo
  const clientes = await prisma.cliente.findMany({
    where: { es_socio: true },
    include: {
      plan: true,
      movimientocuenta: true
    }
  });

  console.log('--- REVISIÓN DE CLIENTES Y SUS SALDOS VS PLANES ---');
  for (const c of clientes) {
    if (c.plan && c.movimientocuenta.length > 0) {
      console.log(`Cliente ID: ${c.id} (${c.nombre} ${c.apellido})`);
      console.log(`  Plan: ${c.plan.nombre} (Precio: $${c.plan.precio})`);
      console.log(`  Saldo en tabla cliente: $${c.saldo}`);
      console.log(`  Movimientos:`);
      c.movimientocuenta.forEach(m => {
        console.log(`    - ID ${m.id}: ${m.tipo} $${m.monto} | ${m.descripcion} | Fecha: ${m.fecha.toISOString()}`);
      });
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
