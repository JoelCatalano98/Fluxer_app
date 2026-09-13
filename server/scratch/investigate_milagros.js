const prisma = require('../src/config/prisma');

async function main() {
  const ids = [72, 73];
  for (const id of ids) {
    const c = await prisma.cliente.findUnique({
      where: { id },
      include: { plan: true, clienteCategorias: { include: { categoria: true } } }
    });
    console.log(`\n======================================================`);
    console.log(`CLIENTE ${c.id}: ${c.nombre} ${c.apellido}`);
    console.log(`Plan actual: ID ${c.planId} - ${c.plan?.nombre} ($${c.plan?.precio})`);
    console.log(`Saldo en clientes: ${c.saldo} | Estado Pago: ${c.estado_pago}`);
    console.log(`Vencimiento Cuota: ${c.vencimientoCuota}`);
    console.log(`Disciplinas:`, c.clienteCategorias.map(cc => cc.categoria.nombre));
    console.log(`======================================================`);

    const movs = await prisma.movimientocuenta.findMany({
      where: { clienteId: id },
      orderBy: { id: 'asc' }
    });
    console.log(`MOVIMIENTOS DE CUENTA (${movs.length}):`);
    console.table(movs.map(m => ({
      id: m.id,
      monto: m.monto,
      tipo: m.tipo,
      descripcion: m.descripcion,
      fecha: m.fecha.toISOString(),
      pagoId: m.pagoId,
      branchId: m.branchId
    })));

    const pagos = await prisma.pago.findMany({
      where: { clienteId: id }
    });
    console.log(`PAGOS (${pagos.length}):`, pagos);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
