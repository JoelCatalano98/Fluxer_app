const prisma = require('./src/config/prisma');
const { asegurarCargosAlDia } = require('./src/services/cargos.service');

async function runTest() {
    console.log("=== INICIANDO PLAN DE VERIFICACIÓN (Directo con Prisma y Services) ===");
    try {
        // 1. Crear Plan
        console.log("\n1. Creando Plan 'Pase Libre' ($20.000)...");
        const plan = await prisma.plan.create({
            data: {
                nombre: 'Pase Libre ' + Date.now(),
                precio: 20000,
                frecuencia: 'MENSUAL',
                cantidadClases: 99
            }
        });
        console.log(`-> Plan creado con ID: ${plan.id}, Precio: $${plan.precio}`);

        // 2. Crear Categoria (Simulando un payload malicioso si estuviera permitido a nivel prisma)
        // Como a nivel Prisma ya no existe planId, no podemos ni intentar pasarlo en el create()
        // Si intentamos pasar planId aca, Prisma tiraría error.
        console.log("\n2. Creando Categoría 'Pilates'...");
        const categoria = await prisma.categoria.create({
            data: {
                nombre: 'Pilates ' + Date.now(),
                color: '#123456',
                activo: true
                // planId: 9999 // <- Prisma rechazaría esto directamente
            }
        });
        console.log(`-> Categoría creada con ID: ${categoria.id}. (Sin ninguna referencia a planId)`);

        // 3. Crear Cliente
        console.log("\n3. Creando Cliente marcado como 'Es Socio' asignando Categoría y Plan...");
        const d = new Date();
        d.setDate(d.getDate() - 5);
        d.setHours(0,0,0,0);
        
        const cliente = await prisma.cliente.create({
            data: {
                nombre: 'Test',
                apellido: 'Verificacion',
                dni_cuit: 'V-' + Date.now(),
                es_socio: true,
                categoriaId: categoria.id,
                planId: plan.id, // Asignado directamente al cliente
                fecha_inicio: d,
                vencimientoCuota: d,
                estado_pago: 'ALDIA',
                estado_cliente: 'ACTIVO',
                codigo_socio: 'TEST-123'
            }
        });
        console.log(`-> Cliente creado con ID: ${cliente.id}`);
        console.log(`   - Plan asignado: ${cliente.planId}`);
        console.log(`   - Categoría asignada: ${cliente.categoriaId}`);

        // 4. Disparar asegurarCargosAlDia
        console.log("\n4. Disparando asegurarCargosAlDia(clienteId)...");
        await asegurarCargosAlDia(cliente.id);
        console.log("-> Función asegurarCargosAlDia completada.");

        // 5. Verificar Cargos Generados
        console.log("\n5. Verificando los Movimientos generados para el cliente...");
        const movimientos = await prisma.movimientocuenta.findMany({
            where: { clienteId: cliente.id }
        });
        
        const cargo = movimientos.find(m => m.tipo === 'CARGO');
        console.log(`-> Cargos encontrados: ${movimientos.length}`);
        if (cargo) {
            console.log(`   - Tipo: ${cargo.tipo}`);
            console.log(`   - Monto Real (En DB): $${cargo.monto} (Negativo significa deuda)`);
            console.log(`   - Monto Absoluto Generado: $${Math.abs(cargo.monto)}`);
            console.log(`   - Descripción: ${cargo.descripcion}`);
            if (Math.abs(cargo.monto) === 20000) {
                console.log("   ✅ ÉXITO: El cargo es de $20.000, leído correctamente desde el Plan del Cliente.");
            } else {
                console.log("   ❌ ERROR: El cargo no coincide con el precio del Plan.");
            }
        } else {
            console.log("   ❌ ERROR: NO SE GENERÓ NINGÚN CARGO.");
        }

        // 6. Verificar Ingresos Proyectados (misma lógica que el Dashboard Controller)
        console.log("\n6. Verificando Ingresos Proyectados...");
        const clientesSocioActivos = await prisma.cliente.findMany({
            where: { 
                es_socio: true, 
                estado_cliente: 'ACTIVO',
                plan: {
                    isNot: null
                }
            },
            include: {
                plan: true
            }
        });

        const ingresosProyectados = clientesSocioActivos.reduce((total, c) => {
            return total + (c.plan ? Number(c.plan.precio) : 0);
        }, 0);
        
        console.log(`-> Ingresos Proyectados Totales (Todos los clientes activos): $${ingresosProyectados}`);
        
        console.log("\n=== PRUEBA FINALIZADA ===");
    } catch (e) {
        console.error("Error en la prueba:", e);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
