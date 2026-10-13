const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mysql://root:Fluxer2026!!@localhost:3306/fluxer_auditoria' } } });

async function verify() {
  const ids = [23, 101, 152, 194, 11, 52, 36, 93, 114, 76, 49, 43, 142, 133, 161, 163];
  const clients = await prisma.cliente.findMany({
    where: { id: { in: ids } },
    include: {
      movimientocuenta: { orderBy: { id: 'desc' } }
    }
  });

  console.log("=== COMPROBACIÓN DE SALDOS Y ESTADOS EN fluxer_auditoria TRAS APPLY ===");
  const table = clients.map(c => {
    const recargosOct = c.movimientocuenta.filter(m => m.tipo === 'RECARGO' && m.descripcion.includes('10/2026'));
    const bonifs = c.movimientocuenta.filter(m => m.tipo === 'BONIFICACION' && m.descripcion.includes('10/2026'));
    return {
      ID: c.id,
      Alumno: `${c.nombre} ${c.apellido}`.trim(),
      Saldo: c.saldo,
      Estado: c.estado_pago,
      'Recargo 10/2026': recargosOct.length,
      'Bonif 10/2026': bonifs.length > 0 ? `$${bonifs[0].monto}` : '$0'
    };
  });
  console.table(table);
}

verify().catch(console.error).finally(() => prisma.$disconnect());
