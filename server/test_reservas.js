const prisma = require('./src/config/prisma');
const { reservarTurno } = require('./src/controllers/turnoSocio.controller');

// Mocks para req y res
function mockRes() {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
}

async function runTests() {
    console.log("=== INICIANDO PRUEBAS REALES DE RESERVAS ===");

    // 1. Preparación de Datos Base
    // Crear o buscar un horario
    let horario = await prisma.horarioConfig.findFirst();
    if (!horario) {
        horario = await prisma.horarioConfig.create({
            data: { dia_semana: 1, hora_inicio: new Date('2023-01-01T10:00:00Z'), hora_fin: new Date('2023-01-01T11:00:00Z') }
        });
    }

    // Crear un plan Mensual con límite de 8
    const plan = await prisma.plan.create({
        data: {
            nombre: "Test Plan Mensual 8",
            precio: 1000,
            frecuencia: "Mensual",
            tipoFrecuencia: "MENSUAL",
            cantidadClases: 8,
            activo: true
        }
    });

    const categoria = await prisma.categoria.create({
        data: { nombre: "Cat Test", planId: plan.id }
    });

    // Crear un cliente ALDIA
    const clienteAldia = await prisma.cliente.create({
        data: {
            nombre: "Test",
            apellido: "Al Dia",
            dni_cuit: "11111111",
            estado_pago: "ALDIA",
            estado_cliente: "ACTIVO",
            categoriaId: categoria.id,
            vencimientoCuota: new Date(new Date().setMonth(new Date().getMonth() + 1)) // próximo mes
        }
    });

    // Crear un cliente MOROSO
    const clienteMoroso = await prisma.cliente.create({
        data: {
            nombre: "Test",
            apellido: "Moroso",
            dni_cuit: "22222222",
            estado_pago: "MOROSO",
            estado_cliente: "ACTIVO",
            categoriaId: categoria.id
        }
    });

    // === CASO 1: Plan mensual con límite de 8 clases ===
    console.log("\n--- CASO 1: Límite de 8 clases mensuales ---");
    // Llenarle 8 turnos a clienteAldia en su ciclo
    const fechaReserva = new Date();
    fechaReserva.setUTCHours(0,0,0,0);
    // Para que no salte validación de horario expirado, le damos una fecha futura (mañana)
    const manana = new Date(fechaReserva);
    manana.setDate(manana.getDate() + 1);

    // Llenamos 8 turnos en el pasado/presente (mismo ciclo)
    for (let i = 0; i < 8; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        await prisma.turnoCliente.create({
            data: { clienteId: clienteAldia.id, horarioId: horario.id, fecha: d }
        });
    }

    let req = { body: { clienteId: clienteAldia.id, horarioId: horario.id, fechaExacta: manana.toISOString() } };
    let res = mockRes();
    await reservarTurno(req, res);
    console.log("Resultado intento 9 (Debe ser rechazado por cupo):", JSON.stringify({ status: res.statusCode, data: res.data }, null, 2));


    // === CASO 2: Moroso bloqueado (param=true) ===
    console.log("\n--- CASO 2: Moroso bloqueado con parámetro en true ---");
    await prisma.parametroSistema.upsert({
        where: { clave: 'bloquearReservaPorMora' },
        update: { valor: 'true' },
        create: { clave: 'bloquearReservaPorMora', descripcion: '...', tipo: 'boolean', valor: 'true' }
    });

    req = { body: { clienteId: clienteMoroso.id, horarioId: horario.id, fechaExacta: manana.toISOString() } };
    res = mockRes();
    await reservarTurno(req, res);
    console.log("Resultado moroso con param=true (Debe ser rechazado):", JSON.stringify({ status: res.statusCode, data: res.data }, null, 2));


    // === CASO 3: Moroso permitido (param=false) ===
    console.log("\n--- CASO 3: Moroso permitido con parámetro en false ---");
    await prisma.parametroSistema.update({
        where: { clave: 'bloquearReservaPorMora' },
        data: { valor: 'false' }
    });

    req = { body: { clienteId: clienteMoroso.id, horarioId: horario.id, fechaExacta: manana.toISOString() } };
    res = mockRes();
    await reservarTurno(req, res);
    console.log("Resultado moroso con param=false (Debe ser permitido):", JSON.stringify({ status: res.statusCode, data: res.data }, null, 2));


    // Cleanup
    await prisma.turnoCliente.deleteMany({ where: { clienteId: { in: [clienteAldia.id, clienteMoroso.id] } } });
    await prisma.cliente.deleteMany({ where: { id: { in: [clienteAldia.id, clienteMoroso.id] } } });
    await prisma.categoria.delete({ where: { id: categoria.id } });
    await prisma.plan.delete({ where: { id: plan.id } });
    // Restore param
    await prisma.parametroSistema.update({
        where: { clave: 'bloquearReservaPorMora' },
        data: { valor: 'true' }
    });
}

runTests().then(() => {
    console.log("\nPruebas finalizadas.");
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
