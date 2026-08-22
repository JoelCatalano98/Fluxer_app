const prisma = require('../config/prisma');

async function asegurarCargosAlDia(clienteId) {
    const idInt = parseInt(clienteId);
    if (isNaN(idInt)) return;

    // Obtener la configuración financiera
    const config = await prisma.configuracion.findFirst();
    const diaMaximoCobro = config?.diaMaximoCobro || 10;
    const recargoPorcentaje = config?.recargoPorcentaje || 10.0;

    const cliente = await prisma.cliente.findUnique({
        where: { id: idInt },
        include: {
            categoria: {
                include: { plan: true }
            }
        }
    });

    if (!cliente || !cliente.categoria || !cliente.categoria.plan) {
        return; // Sin plan asignado, no hay cargos
    }

    const plan = cliente.categoria.plan;
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
        // Si el día de hoy es MAYOR al día configurado para el mes vencido, aplicar recargo.
        // Solo aplica si el recargo es mayor a 0 y la cuota es > 0.
        const fechaLimitePago = new Date(currentVencimiento);
        // Si el cargo se genera un día mayor al diaMaximoCobro (ej: alta el día 15), 
        // su límite para ESTA cuota inicial es su mismo día de alta, no el día 10 hacia atrás.
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
                fecha: fechaRecargo, // Lo guardamos con la fecha de facturación a inicio del día
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
        await prisma.movimientocuenta.createMany({
            data: nuevosMovimientos
        });

        await prisma.cliente.update({
            where: { id: cliente.id },
            data: { vencimientoCuota: currentVencimiento }
        });
    }

    // Recalcular saldo sumando todos los movimientos (incluyendo los recargos recién creados)
    const todosLosMovimientos = await prisma.movimientocuenta.findMany({
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

    await prisma.cliente.update({
        where: { id: cliente.id },
        data: { 
            saldo: nuevoSaldo,
            estado_pago: nuevoEstadoPago
        }
    });

    if (cargosGenerados >= maxCargos) {
        console.warn(`Cliente ${cliente.id} alcanzó el límite de 12 cargos generados.`);
    }

    return { cargosGenerados, limiteAlcanzado: cargosGenerados >= maxCargos, nuevoSaldo, nuevoVencimiento: currentVencimiento };
}

module.exports = { asegurarCargosAlDia };
