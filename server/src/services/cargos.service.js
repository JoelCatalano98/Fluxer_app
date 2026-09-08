const prisma = require('../config/prisma');

async function asegurarCargosAlDia(clienteId) {
    const idInt = parseInt(clienteId);
    if (isNaN(idInt)) return;

    return await prisma.$transaction(async (tx) => {
        // Obtener la configuración financiera
        const config = await tx.configuracion.findFirst();
        const diaMaximoCobro = config?.diaMaximoCobro || 10;
        const recargoPorcentaje = config?.recargoPorcentaje || 10.0;

        // 1. Bloqueo pesimista: Obtiene lock exclusivo en InnoDB
        const clientesLock = await tx.$queryRaw`SELECT * FROM clientes WHERE id = ${idInt} FOR UPDATE`;
        if (!clientesLock || clientesLock.length === 0) return;
        
        const cliente = clientesLock[0];

        // Hooks temporales para test
        if (process.env.TEST_MODE === 'CONCURRENCY') {
            if (!global.testLockOrder) global.testLockOrder = [];
            const isFirst = global.testLockOrder.length === 0;
            const reqName = isFirst ? 'A' : 'B';
            
            global.testLockOrder.push(`Request ${reqName} obtiene lock`);
            
            if (isFirst) {
                global.testLockOrder.push(`Request A simulando demora de 2000ms...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            tx.reqName = reqName; // Guardamos el nombre en el objeto tx
        }

        if (!cliente.planId) return; // Sin plan asignado, no hay cargos

        const plan = await tx.plan.findUnique({ where: { id: cliente.planId } });
        if (!plan) return;

        const precio = parseFloat(plan.precio) || 0;

        let vencimiento = cliente.vencimientoCuota;
        const hoy = new Date();
        // Limpiamos horas para comparar solo fechas de forma justa
        hoy.setHours(0,0,0,0);

        if (!vencimiento) {
            vencimiento = new Date();
            vencimiento.setHours(0, 0, 0, 0);
        }

        let cargosGenerados = 0;
        const maxCargos = 12;
        const nuevosMovimientos = [];
        let currentVencimiento = new Date(vencimiento);
        currentVencimiento.setHours(0, 0, 0, 0);

        // Mientras el vencimiento ya pasó o es hoy, y no superamos el límite
        while (currentVencimiento <= hoy && cargosGenerados < maxCargos) {
            const mesAnio = `${String(currentVencimiento.getMonth() + 1).padStart(2, '0')}/${currentVencimiento.getFullYear()}`;
            
            // 1. Cargo base de la cuota
            const fechaCargo = new Date(currentVencimiento);
            fechaCargo.setHours(0, 0, 0, 0); // Normalización explícita a inicio del día

            nuevosMovimientos.push({
                monto: precio,
                tipo: 'CARGO',
                descripcion: `Cuota mensual - ${mesAnio}`,
                fecha: fechaCargo,
                clienteId: cliente.id
            });

            // 2. Comprobar si corresponde recargo: 
            const fechaLimitePago = new Date(currentVencimiento);
            const diaReal = Math.max(diaMaximoCobro, currentVencimiento.getDate());
            fechaLimitePago.setDate(diaReal);

            if (hoy > fechaLimitePago && recargoPorcentaje > 0 && precio > 0) {
                const montoRecargo = (precio * recargoPorcentaje) / 100;
                const fechaRecargo = new Date(currentVencimiento);
                fechaRecargo.setHours(0, 0, 0, 0);

                nuevosMovimientos.push({
                    monto: montoRecargo,
                    tipo: 'RECARGO',
                    descripcion: `Recargo por mora (${recargoPorcentaje}%) - ${mesAnio}`,
                    fecha: fechaRecargo,
                    clienteId: cliente.id
                });
            }

            // 3. Avanzar 1 mes EXACTO apuntando siempre al día configurado (diaMaximoCobro)
            const targetMonth = currentVencimiento.getMonth() + 1;
            currentVencimiento.setMonth(targetMonth);
            currentVencimiento.setDate(diaMaximoCobro);
            if (currentVencimiento.getMonth() !== (targetMonth % 12)) {
                currentVencimiento.setDate(0); // Vuelve al último día del targetMonth
            }

            cargosGenerados++;
        }

        if (nuevosMovimientos.length > 0) {
            await tx.movimientocuenta.createMany({
                data: nuevosMovimientos
            });

            if (process.env.TEST_MODE === 'ROLLBACK') {
                throw new Error("Fallo simulado de red post-creación para test de rollback");
            }

            await tx.cliente.update({
                where: { id: cliente.id },
                data: { vencimientoCuota: currentVencimiento }
            });
        }

        // Recalcular saldo sumando todos los movimientos (incluyendo los recargos recién creados)
        const todosLosMovimientos = await tx.movimientocuenta.findMany({
            where: { clienteId: cliente.id }
        });

        let nuevoSaldo = 0;
        todosLosMovimientos.forEach(mov => {
            const monto = parseFloat(mov.monto);
            if (mov.tipo === 'CARGO' || mov.tipo === 'RECARGO') { // RECARGO también suma deuda
                nuevoSaldo -= monto; 
            } else if (mov.tipo === 'INGRESO' || mov.tipo === 'PAGO') {
                nuevoSaldo += monto; 
            } else {
                nuevoSaldo += monto;
            }
        });

        const nuevoEstadoPago = nuevoSaldo < 0 ? 'MOROSO' : 'ALDIA';

        await tx.cliente.update({
            where: { id: cliente.id },
            data: { 
                saldo: nuevoSaldo,
                estado_pago: nuevoEstadoPago
            }
        });

        if (cargosGenerados >= maxCargos) {
            console.warn(`Cliente ${cliente.id} alcanzó el límite de 12 cargos generados.`);
        }

        if (process.env.TEST_MODE === 'CONCURRENCY') {
            global.testLockOrder.push(`Request ${tx.reqName || 'Desconocido'} finaliza y hace COMMIT`);
        }

        return { cargosGenerados, limiteAlcanzado: cargosGenerados >= maxCargos, nuevoSaldo, nuevoVencimiento: currentVencimiento };
    });
}

function calcularCicloActual(vencimientoActual, diaMaximoCobro = 10) {
    if (!vencimientoActual) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fin = new Date(hoy);
        fin.setMonth(fin.getMonth() + 1);
        fin.setDate(diaMaximoCobro);
        return { inicio: hoy, fin };
    }

    const fin = new Date(vencimientoActual);
    fin.setHours(0, 0, 0, 0);

    const inicio = new Date(fin);
    const targetMonth = inicio.getMonth() - 1;
    inicio.setMonth(targetMonth);
    inicio.setDate(diaMaximoCobro);
    
    const expectedMonth = (targetMonth % 12 + 12) % 12;
    if (inicio.getMonth() !== expectedMonth) {
        inicio.setDate(0); 
    }

    return { inicio, fin };
}

module.exports = { asegurarCargosAlDia, calcularCicloActual };
