const prisma = require('./src/config/prisma');
const { deleteTurno } = require('./src/controllers/turnos.controller');

function mockRes() {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
}

async function testCancelAgain() {
    console.log("=== PRUEBA DE DOBLE CANCELACION PENALIZADA ===");
    
    // Buscar un cliente de prueba
    const cliente = await prisma.cliente.findFirst({ where: { dni_cuit: "33333333" } });
    if (!cliente) return console.log("Cliente 33333333 no encontrado. Corre test_cecilia.js primero.");

    // Buscar su turno ACTIVO
    const turnos = await prisma.turnoCliente.findMany({ where: { clienteId: cliente.id } });
    console.log("Turnos actuales de Cecilia:", turnos.map(t => ({ id: t.id, estado: t.estado })));

    const turnoActivo = turnos.find(t => t.estado === 'ACTIVO');
    if (!turnoActivo) return console.log("No hay turno ACTIVO para cancelar.");

    console.log(`Intentando cancelar el turno ACTIVO (ID: ${turnoActivo.id}) con penalidad...`);
    const req = { params: { id: turnoActivo.id }, query: { penalidad: 'true' } };
    const res = mockRes();
    
    await deleteTurno(req, res);
    console.log("Resultado:", JSON.stringify({ status: res.statusCode, data: res.data }, null, 2));
}

testCancelAgain().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
