const jwt = require('jsonwebtoken');
const prisma = require('../src/config/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'cc6bbfca6ce13d83a3c5abe432577d06690cb7f443cbb06a861d7d6a0bcfee7a0114ce2f74f83ca5299177302d22d3ad1e2c9a9f89aefcf224aca3046ff4464a';

async function testBookingError() {
  const socioToken = jwt.sign(
    { id: 74, email: 'joelcata128@gmail.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Intentar reservar en una fecha donde ya tenga 2 clases o agregar 2 clases para provocar el 400
  // Primero veamos qué horarios hay disponibles para lunes 2026-09-14
  const resHorarios = await fetch('http://localhost:5000/api/socio/turnos/disponibles?dia_semana=1&fecha=2026-09-14', {
    headers: { 'Authorization': `Bearer ${socioToken}` }
  });
  const horarios = await resHorarios.json();
  console.log('HORARIOS DISPONIBLES LUNES 14:', horarios.data?.map(h => ({ id: h.id, hora: h.hora_inicio, cat: h.categoriaId })));

  // Intentemos reservar un horario
  const horario1 = horarios.data?.[0]?.id;
  const horario2 = horarios.data?.[1]?.id;

  // Hagamos reservas hasta exceder las 2 clases permitidas del plan 25
  const body1 = { horarioId: horario1, fechaExacta: '2026-09-14', clienteId: 74 };
  const r1 = await fetch('http://localhost:5000/api/socio/turnos/reservar', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${socioToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body1)
  });
  const d1 = await r1.json();
  console.log('RESERVA 1:', r1.status, d1);

  const body2 = { horarioId: horario2, fechaExacta: '2026-09-14', clienteId: 74 };
  const r2 = await fetch('http://localhost:5000/api/socio/turnos/reservar', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${socioToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body2)
  });
  const d2 = await r2.json();
  console.log('RESERVA 2:', r2.status, d2);

  // Tercera reserva para disparar el 400 exacto
  const horario3 = horarios.data?.[2]?.id;
  const body3 = { horarioId: horario3, fechaExacta: '2026-09-14', clienteId: 74 };
  const r3 = await fetch('http://localhost:5000/api/socio/turnos/reservar', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${socioToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body3)
  });
  const d3 = await r3.json();
  console.log('RESERVA 3 (EXCEDE LIMITE 400):', r3.status, d3);
}

testBookingError().catch(console.error).finally(() => prisma.$disconnect());
