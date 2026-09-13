const jwt = require('jsonwebtoken');
const prisma = require('../src/config/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'cc6bbfca6ce13d83a3c5abe432577d06690cb7f443cbb06a861d7d6a0bcfee7a0114ce2f74f83ca5299177302d22d3ad1e2c9a9f89aefcf224aca3046ff4464a';

async function runTestStep6() {
  console.log('================================================================');
  console.log('PRUEBA PASO 6: PLAN DE 2 CLASES, 2 DISCIPLINAS DISTINTAS');
  console.log('================================================================');

  // Usamos un cliente de prueba limpio: Cliente 74 (Andrea)
  // Asegurar plan 25 (Plan mixto, 2 clases semanales)
  await prisma.cliente.update({
    where: { id: 74 },
    data: { planId: 25, estado_pago: 'ALDIA', estado_cliente: 'ACTIVO' }
  });

  // Asegurar las 2 disciplinas asignadas (Pilates 5 y Taekwondo 12)
  await prisma.clienteCategoria.deleteMany({ where: { clienteId: 74 } });
  await prisma.clienteCategoria.createMany({
    data: [
      { clienteId: 74, categoriaId: 5 },  // Pilates
      { clienteId: 74, categoriaId: 12 } // Taekwondo
    ]
  });

  // Limpiar turnos existentes del cliente 74 en esa semana de prueba (14-20 Sept)
  await prisma.turnoCliente.deleteMany({
    where: {
      clienteId: 74,
      fecha: {
        gte: new Date('2026-09-14T00:00:00.000Z'),
        lte: new Date('2026-09-20T23:59:59.999Z')
      }
    }
  });

  console.log('Cliente 74 configurado limpiamente:');
  console.log('- Plan: Plan mixto (ID 25, max 2 clases/semana)');
  console.log('- Disciplinas asignadas: Pilates (5) y Taekwondo (12)');
  console.log('- Turnos previos en la semana 14/09-20/09: 0');

  const token74 = jwt.sign({ id: 74, email: 'joelcata128@gmail.com' }, JWT_SECRET, { expiresIn: '1h' });
  const headers = { 'Authorization': `Bearer ${token74}`, 'Content-Type': 'application/json' };

  // 1. RESERVA 1: Lunes 14/09 - Disciplina: Pilates (horario 94, cat 5)
  console.log('\n--- INTENTO 1: Lunes 14/09 a las 08:00 hs (PILATES) ---');
  const r1 = await fetch('http://localhost:5000/api/socio/turnos/reservar', {
    method: 'POST',
    headers,
    body: JSON.stringify({ horarioId: 94, clienteId: 74, fechaExacta: '2026-09-14' })
  });
  const d1 = await r1.json();
  console.log('Status:', r1.status);
  console.log('Respuesta:', d1);

  // 2. RESERVA 2: Martes 15/09 - Disciplina: Taekwondo (horario 109, cat 12)
  console.log('\n--- INTENTO 2: Martes 15/09 a las 10:00 hs (TAEKWONDO - OTRA DISCIPLINA) ---');
  const r2 = await fetch('http://localhost:5000/api/socio/turnos/reservar', {
    method: 'POST',
    headers,
    body: JSON.stringify({ horarioId: 109, clienteId: 74, fechaExacta: '2026-09-15' })
  });
  const d2 = await r2.json();
  console.log('Status:', r2.status);
  console.log('Respuesta:', d2);

  // 3. RESERVA 3 (DEBE BLOQUEARSE): Miércoles 16/09 - Cualquier disciplina (horario 95, Pilates cat 5)
  console.log('\n--- INTENTO 3 (EXCEDE CUPO 2): Miércoles 16/09 a las 08:00 hs ---');
  const r3 = await fetch('http://localhost:5000/api/socio/turnos/reservar', {
    method: 'POST',
    headers,
    body: JSON.stringify({ horarioId: 95, clienteId: 74, fechaExacta: '2026-09-16' })
  });
  const d3 = await r3.json();
  console.log('Status:', r3.status);
  console.log('Respuesta:', d3);

  // 4. RESERVA 4 (DEBE BLOQUEARSE TAMBIÉN): Jueves 17/09 - Taekwondo (horario 111, cat 12)
  console.log('\n--- INTENTO 4 (EXCEDE CUPO 2): Jueves 17/09 a las 09:00 hs (TAEKWONDO) ---');
  const r4 = await fetch('http://localhost:5000/api/socio/turnos/reservar', {
    method: 'POST',
    headers,
    body: JSON.stringify({ horarioId: 111, clienteId: 74, fechaExacta: '2026-09-17' })
  });
  const d4 = await r4.json();
  console.log('Status:', r4.status);
  console.log('Respuesta:', d4);

  // Verificación final en base de datos
  const turnosFinales = await prisma.$queryRawUnsafe(`
    SELECT tc.id, tc.fecha, tc.horarioId, tc.clienteId, hc.categoriaId, cat.nombre as disciplina
    FROM turnos_clientes tc
    JOIN horarios_config hc ON tc.horarioId = hc.id
    JOIN categorias cat ON hc.categoriaId = cat.id
    WHERE tc.clienteId = 74 AND tc.fecha BETWEEN '2026-09-14' AND '2026-09-20'
  `);
  console.log('\n================================================================');
  console.log('TURNOS REALMENTE REGISTRADOS EN LA SEMANA (DEBE SER EXACTAMENTE 2):');
  console.table(turnosFinales);
  console.log('Total de reservas efectivas:', turnosFinales.length);
  console.log('================================================================');
}

runTestStep6().catch(console.error).finally(() => prisma.$disconnect());
