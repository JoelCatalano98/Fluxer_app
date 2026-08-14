const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { asegurarCargosAlDia } = require('./src/services/cargos.service.js');

async function test() {
    // 1. Obtener una categoría que tenga plan (para que se puedan generar cargos)
    const categoria = await prisma.categoria.findFirst({ where: { planId: { not: null } } });
    if (!categoria) {
        console.log("No hay categorías con plan para probar.");
        process.exit(0);
    }

    const baseDate = new Date();
    const initialVencimiento = new Date(baseDate);
    initialVencimiento.setDate(initialVencimiento.getDate() + 30);
    console.log("Creando cliente con baseDate (hoy):", baseDate);
    console.log("vencimientoCuota esperado (base + 30 días):", initialVencimiento);

    const nuevoCliente = await prisma.cliente.create({
        data: {
            nombre: "Test",
            apellido: "SocioNuevo",
            dni_cuit: "99999999" + Date.now().toString().slice(-4),
            categoriaId: categoria.id,
            es_socio: true, // Importante para que asigne el vencimiento
            vencimientoCuota: initialVencimiento
        }
    });

    console.log("Cliente creado con ID:", nuevoCliente.id);
    console.log("Vencimiento cuota guardado:", nuevoCliente.vencimientoCuota);

    // 3. Ejecutar asegurarCargosAlDia
    await new Promise(resolve => setTimeout(resolve, 100));

    const resultado = await asegurarCargosAlDia(nuevoCliente.id);
    
    console.log("Resultado de asegurarCargosAlDia:", resultado);

    // Limpiar prueba
    await prisma.cliente.delete({ where: { id: nuevoCliente.id } });
    process.exit(0);
}

test().catch(e => {
    console.error(e);
    process.exit(1);
});
