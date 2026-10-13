const prisma = require('../config/prisma');

const OFFSET_AR_MS = -3 * 60 * 60 * 1000; // Argentina UTC-3 sin DST

function aComponentesArgentina(date = new Date()) {
    const dAr = new Date(date.getTime() + OFFSET_AR_MS);
    return {
        year: dAr.getUTCFullYear(),
        month: dAr.getUTCMonth(),
        day: dAr.getUTCDate(),
        numeroFecha: dAr.getUTCFullYear() * 10000 + (dAr.getUTCMonth() + 1) * 100 + dAr.getUTCDate()
    };
}

function finDelDiaArgentina(year, month, day) {
    // 23:59:59.999 en Argentina (UTC-3) equivale a 26:59:59.999 en UTC (+3 horas)
    return new Date(Date.UTC(year, month, day, 26, 59, 59, 999));
}

async function asegurarCargosAlDia(clienteId, options = {}) {
    const idInt = parseInt(clienteId);
    if (isNaN(idInt)) return;

    return await prisma.$transaction(async (tx) => {
        // Obtener la configuración financiera
        const config = await tx.configuracion.findFirst();
        const diaMaximoCobro = config?.diaMaximoCobro ?? 10;
        const recargoPorcentaje = config?.recargoPorcentaje ?? 10.0;

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

        // Movimientos existentes del cliente para calcular saldo_al_corte
        const movimientosExistentes = await tx.movimientocuenta.findMany({
            where: { clienteId: cliente.id },
            orderBy: { fecha: 'asc' }
        });

        let vencimiento = cliente.vencimientoCuota;
        const ahora = options.fechaSimulada ? new Date(options.fechaSimulada) : new Date();
        const hoyAr = aComponentesArgentina(ahora);

        if (!vencimiento) {
            vencimiento = new Date();
            vencimiento.setHours(0, 0, 0, 0);
        }

        let cargosGenerados = 0;
        const maxCargos = 12;
        const nuevosMovimientos = [];
        let currentVencimiento = new Date(vencimiento);
        currentVencimiento.setHours(0, 0, 0, 0);

        // Mientras el vencimiento ya pasó o es hoy (en hora Argentina), y no superamos el límite
        while (cargosGenerados < maxCargos) {
            const numeroFechaVenc = currentVencimiento.getFullYear() * 10000 + (currentVencimiento.getMonth() + 1) * 100 + currentVencimiento.getDate();
            if (numeroFechaVenc > hoyAr.numeroFecha) {
                break;
            }

            const mesAnio = `${String(currentVencimiento.getMonth() + 1).padStart(2, '0')}/${currentVencimiento.getFullYear()}`;
            
            // 1. Cargo base de la cuota
            const fechaCargo = new Date(currentVencimiento);
            fechaCargo.setHours(0, 0, 0, 0); // Normalización explícita a inicio del día

            const cargoActual = {
                monto: precio,
                tipo: 'CARGO',
                descripcion: `Cuota mensual - ${mesAnio}`,
                fecha: fechaCargo,
                clienteId: cliente.id,
                ...(cliente.branchId && { branchId: cliente.branchId })
            };
            nuevosMovimientos.push(cargoActual);

            // 2. Comprobar si corresponde recargo:
            // Corte: fin del día fechaLimitePago en hora Argentina (UTC-3, sin DST)
            const diaReal = Math.max(diaMaximoCobro, currentVencimiento.getDate());
            const corteAr = finDelDiaArgentina(currentVencimiento.getFullYear(), currentVencimiento.getMonth(), diaReal);

            // saldo_al_corte = suma de movimientocuenta del cliente con fecha <= corte,
            // EXCLUYENDO el CARGO y el RECARGO del ciclo actual.
            // Incluye movimientos existentes + movimientos de ciclos anteriores del bucle actual.
            let saldoAlCorte = 0;
            for (const mov of movimientosExistentes) {
                if (new Date(mov.fecha) <= corteAr) {
                    const monto = parseFloat(mov.monto);
                    if (mov.tipo === 'CARGO' || mov.tipo === 'RECARGO') {
                        saldoAlCorte -= monto;
                    } else {
                        saldoAlCorte += monto;
                    }
                }
            }
            for (const mov of nuevosMovimientos) {
                if (mov !== cargoActual && new Date(mov.fecha) <= corteAr) {
                    const monto = parseFloat(mov.monto);
                    if (mov.tipo === 'CARGO' || mov.tipo === 'RECARGO') {
                        saldoAlCorte -= monto;
                    } else {
                        saldoAlCorte += monto;
                    }
                }
            }

            // Generar RECARGO solo si:
            // ahora (hora Argentina) > fin del día fechaLimitePago (hora Argentina) Y saldo_al_corte < cuota
            const pasoFechaLimite = ahora.getTime() > corteAr.getTime();
            const correspondeRecargo = pasoFechaLimite && (saldoAlCorte < precio) && recargoPorcentaje > 0 && precio > 0;

            if (correspondeRecargo) {
                const montoRecargo = (precio * recargoPorcentaje) / 100;
                const fechaRecargo = new Date(currentVencimiento);
                fechaRecargo.setHours(0, 0, 0, 0);

                nuevosMovimientos.push({
                    monto: montoRecargo,
                    tipo: 'RECARGO',
                    descripcion: `Recargo por mora (${recargoPorcentaje}%) - ${mesAnio}`,
                    fecha: fechaRecargo,
                    clienteId: cliente.id,
                    ...(cliente.branchId && { branchId: cliente.branchId })
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

module.exports = { asegurarCargosAlDia, calcularCicloActual, aComponentesArgentina, finDelDiaArgentina };
