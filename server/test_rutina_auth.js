const axios = require('axios');
const prisma = require('./src/config/prisma');
const jwt = require('jsonwebtoken');

require('dotenv').config();

async function testAuth() {
    console.log("=== PRUEBA DE AUTORIZACION EN RUTINAS SOCIO ===");
    
    // Buscar dos clientes
    const clienteA = await prisma.cliente.findFirst({ where: { dni_cuit: "33333333" } });
    const clienteB = await prisma.cliente.findFirst({ where: { dni_cuit: "22222222" } }); // Assuming this exists or we can just create a fake token
    
    if (!clienteA) return console.log("Cliente A no encontrado.");
    
    // Buscar un ejercicio de su rutina
    const rutinaA = await prisma.rutina.findFirst({
        where: { clienteId: clienteA.id },
        include: { ejercicios: true }
    });
    
    if (!rutinaA || rutinaA.ejercicios.length === 0) return console.log("Cliente A no tiene ejercicios.");
    
    const ejercicioId = rutinaA.ejercicios[0].id;
    
    console.log(`Intentando editar el ejercicio ${ejercicioId} SIN TOKEN...`);
    try {
        await axios.put(`http://localhost:5000/api/socio/rutinas/ejercicio/${ejercicioId}`, {
            pesoReal: '100'
        });
        console.log("❌ ERROR: La petición pasó sin token.");
    } catch (error) {
        console.log(`✅ OK: Bloqueado sin token - Status: ${error.response?.status}`);
    }

    console.log(`\nIntentando editar el ejercicio ${ejercicioId} con un token de OTRO socio...`);
    const tokenB = jwt.sign({ id: 99999, role: 'SOCIO' }, process.env.JWT_SECRET);
    
    try {
        await axios.put(`http://localhost:5000/api/socio/rutinas/ejercicio/${ejercicioId}`, {
            pesoReal: '100'
        }, {
            headers: { Authorization: `Bearer ${tokenB}` }
        });
        console.log("❌ ERROR: La petición pasó con token de otro socio.");
    } catch (error) {
        console.log(`✅ OK: Bloqueado con token de otro socio - Status: ${error.response?.status} (${error.response?.data?.message})`);
    }

    console.log(`\nIntentando editar un ejercicio de la RUTINA GENERAL...`);
    const rutinaGeneral = await prisma.rutina.findFirst({
        where: { clienteId: null },
        include: { ejercicios: true }
    });

    if (rutinaGeneral && rutinaGeneral.ejercicios.length > 0) {
        const ejGenId = rutinaGeneral.ejercicios[0].id;
        const tokenA = jwt.sign({ id: clienteA.id, role: 'SOCIO' }, process.env.JWT_SECRET);
        try {
            await axios.put(`http://localhost:5000/api/socio/rutinas/ejercicio/${ejGenId}`, {
                pesoReal: '100'
            }, {
                headers: { Authorization: `Bearer ${tokenA}` }
            });
            console.log("❌ ERROR: La petición pasó para editar la rutina general.");
        } catch (error) {
            console.log(`✅ OK: Bloqueado editar rutina general - Status: ${error.response?.status} (${error.response?.data?.message})`);
        }
    } else {
        console.log("No hay rutina general para probar.");
    }
}

testAuth();
