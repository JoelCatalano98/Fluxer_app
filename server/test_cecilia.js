const prisma = require('./src/config/prisma');
const { reservarTurno } = require('./src/controllers/turnoSocio.controller');
const { deleteTurno } = require('./src/controllers/turnos.controller');

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

async function runTestCecilia() {
    console.log("=== INICIANDO PRUEBA: CASO CECILIA ===");

    // Cleanup de ejecución anterior si falló
    await prisma.turnoCliente.deleteMany({ where: { cliente: { dni_cuit: "33333333" } } });
    await prisma.cliente.deleteMany({ where: { dni_cuit: "33333333" } });
    
    // 1. Crear un horario a las 18hs
    const horario = await prisma.horarioConfig.create({
        data: { dia_semana: 1, hora_inicio: new Date('1970-01-01T18:00:00Z'), hora_fin: new Date('1970-01-01T19:00:00Z'), activo: true }
    });

    // 2. Crear a Cecilia
    const plan = await prisma.plan.create({
        data: { nombre: "Plan Cecilia", precio: 1000, frecuencia: "Mensual", tipoFrecuencia: "MENSUAL", cantidadClases: 4, activo: true }
    });
    const categoria = await prisma.categoria.create({
        data: { nombre: "Cat Cecilia", planId: plan.id }
    });
    const cecilia = await prisma.cliente.create({
        data: { nombre: "Cecilia", apellido: "Test", dni_cuit: "33333333", estado_pago: "ALDIA", estado_cliente: "ACTIVO", categoriaId: categoria.id, vencimientoCuota: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
    });

    // 3. Anotar a Cecilia a las 18hs (mañana)
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setUTCHours(0,0,0,0);

    let req = { body: { clienteId: cecilia.id, horarioId: horario.id, fechaExacta: manana.toISOString() } };
    let res = mockRes();
    console.log("1. Anotando a Cecilia...");
    await reservarTurno(req, res);
    console.log("Resultado de la reserva:", JSON.stringify({ status: res.statusCode, data: res.data }, null, 2));
    
    const turnoId = res.data?.data?.id;
    if (!turnoId) throw new Error("No se pudo crear el turno");

    // 4. Cancelar con descuento (penalidad = true)
    console.log("\n2. Cancelando con descuento (penalidad)...");
    req = { params: { id: turnoId }, query: { penalidad: 'true' } };
    res = mockRes();
    await deleteTurno(req, res);
    console.log("Resultado de la cancelación:", JSON.stringify({ status: res.statusCode, data: res.data }, null, 2));

    // 5. Volver a anotarse
    console.log("\n3. Volviendo a anotar a Cecilia a la misma clase (el viejo está PENALIZADO)...");
    req = { body: { clienteId: cecilia.id, horarioId: horario.id, fechaExacta: manana.toISOString() } };
    res = mockRes();
    await reservarTurno(req, res);
    console.log("Resultado de la segunda reserva:", JSON.stringify({ status: res.statusCode, data: res.data }, null, 2));

    // 6. Prueba de DOBLE CLIC (Crear otro registro ACTIVO directamente simulando race condition)
    console.log("\n4. Simulando DOBLE CLIC: Intentando crear un TERCER registro con estado ACTIVO para la misma clase...");
    try {
        await prisma.turnoCliente.create({
            data: {
                horarioId: horario.id,
                clienteId: cecilia.id,
                fecha: manana,
                estado: 'ACTIVO'
            }
        });
        console.log("❌ MAL: La base de datos permitió crear el duplicado activo.");
    } catch (e) {
        if (e.code === 'P2002') {
            console.log("✅ ÉXITO: La base de datos bloqueó el duplicado activo por restricción única (P2002).");
        } else {
            console.error("Error inesperado:", e);
        }
    }

    // 7. Verificar el conteo total
    const totalTurnos = await prisma.turnoCliente.count({
        where: { clienteId: cecilia.id }
    });
    console.log("\nTotal de registros para Cecilia:", totalTurnos, "(debería ser 2: 1 penalizado y 1 activo)");

    // Limpieza
    await prisma.turnoCliente.deleteMany({ where: { clienteId: cecilia.id } });
    await prisma.cliente.delete({ where: { id: cecilia.id } });
    await prisma.categoria.delete({ where: { id: categoria.id } });
    await prisma.plan.delete({ where: { id: plan.id } });
    await prisma.horarioConfig.delete({ where: { id: horario.id } });
}

runTestCecilia().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
