const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();
const { asegurarCargosAlDia } = require('../src/services/cargos.service');

async function main() {
    console.log("--- INICIANDO AUDITORIA PUNTO 1 ---");

    // 1. Crear un Plan nuevo
    const plan = await prisma.plan.create({
        data: {
            nombre: 'Plan Auditoria $50k',
            precio: 50000,
            frecuencia: 'Mensual',
            cantidadClases: 12
        }
    });
    console.log("✅ Plan creado:", plan);

    // 2. Crear una Categoría nueva (sin planId)
    const categoria = await prisma.categoria.create({
        data: {
            nombre: 'Categoria Auditoria'
        }
    });
    console.log("✅ Categoría creada:", categoria);

    // 3. Crear Cliente "Es Socio" con Plan y Categoría separados
    const cliente = await prisma.cliente.create({
        data: {
            nombre: 'Auditor',
            apellido: 'Test',
            dni_cuit: `AUD-${Date.now()}`,
            es_socio: true,
            planId: plan.id,
            categoriaId: categoria.id
        }
    });
    console.log("✅ Cliente creado:", cliente);

    // 4. Forzar asegurarCargosAlDia
    console.log("Ejecutando asegurarCargosAlDia...");
    await asegurarCargosAlDia(cliente.id);

    // 5. Consultar la base real por el MovimientoCuenta tipo CARGO
    const movimiento = await prisma.movimientocuenta.findFirst({
        where: {
            clienteId: cliente.id,
            tipo: 'CARGO'
        },
        orderBy: { fecha: 'desc' }
    });
    console.log("✅ Movimiento de Cuenta generado:", movimiento);
    if (movimiento && movimiento.monto === plan.precio) {
        console.log("✅ ÉXITO: El monto del cargo coincide exactamente con el precio del plan ($50000).");
    } else {
        console.log("❌ ERROR: El monto del cargo NO coincide.");
    }

    // 2. Confirmar que categoria.controller.js ignora planId enviado
    console.log("--- PROBANDO API DE CATEGORIAS ---");
    // Get superadmin token
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
        usuario: 'admin',
        password: '123'
    });
    const token = loginRes.data.token;

    // Enviar POST a categorias incluyendo un planId a propósito
    try {
        const catRes = await axios.post('http://localhost:5000/api/categorias', {
            nombre: 'Categoria Hackeada',
            planId: 9999
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Respuesta creación categoría:", catRes.data);
        
        // Verificar en DB
        const catDB = await prisma.categoria.findUnique({ where: { id: catRes.data.data.id } });
        console.log("Registro real en la base de datos:", catDB);
        if (catDB.planId === undefined) {
            console.log("✅ ÉXITO: El esquema de Prisma ya no tiene planId, por lo que se ignora por completo.");
        }
    } catch (error) {
        console.log("Error creando categoría por API:", error.response?.data || error.message);
    }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  });
