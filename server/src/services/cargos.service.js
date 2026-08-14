const prisma = require('../config/prisma');

async function asegurarCargosAlDia(clienteId) {
    const idInt = parseInt(clienteId);
    if (isNaN(idInt)) return;

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
    
    // Incluso si el precio es 0, podríamos querer generar el cargo de $0 por completitud histórica,
    // o no generarlo. Generémoslo igual si tiene plan para mantener el vencimiento actualizado.

    let vencimiento = cliente.vencimientoCuota;
    const hoy = new Date();
    
    if (!vencimiento) {
        // Si no tiene fecha, tomamos hoy como fecha de inicio para calcular el primer cargo atrasado.
        vencimiento = new Date();
        vencimiento.setHours(0, 0, 0, 0);
    }

    let cargosGenerados = 0;
    const maxCargos = 12;
    const nuevosMovimientos = [];
    let currentVencimiento = new Date(vencimiento);

    // Mientras el vencimiento ya pasó (es anterior a hoy) y no superamos el límite
    while (currentVencimiento < hoy && cargosGenerados < maxCargos) {
        const mesAnio = `${String(currentVencimiento.getMonth() + 1).padStart(2, '0')}/${currentVencimiento.getFullYear()}`;
        
        nuevosMovimientos.push({
            monto: precio, // Guardado como positivo según instrucciones
            tipo: 'CARGO',
            descripcion: `Cuota mensual - ${mesAnio}`,
            fecha: new Date(currentVencimiento),
            clienteId: cliente.id
        });

        // Avanzar 30 días
        currentVencimiento.setDate(currentVencimiento.getDate() + 30);
        cargosGenerados++;
    }

    if (nuevosMovimientos.length > 0) {
        await prisma.movimientocuenta.createMany({
            data: nuevosMovimientos
        });

        // Actualizar la fecha de vencimiento
        await prisma.cliente.update({
            where: { id: cliente.id },
            data: { vencimientoCuota: currentVencimiento }
        });
    }

    // Recalcular saldo sumando todos los movimientos
    const todosLosMovimientos = await prisma.movimientocuenta.findMany({
        where: { clienteId: cliente.id }
    });

    let nuevoSaldo = 0;
    todosLosMovimientos.forEach(mov => {
        const monto = parseFloat(mov.monto);
        if (mov.tipo === 'CARGO') {
            nuevoSaldo -= monto; // Se guarda positivo, pero representa una deuda (resta)
        } else if (mov.tipo === 'INGRESO' || mov.tipo === 'PAGO') {
            nuevoSaldo += monto; // Pagos suman a favor
        } else {
            // EGRESO, ANULACION, AJUSTE (ya vienen con su propio signo, típicamente negativo para egresos)
            nuevoSaldo += monto; 
        }
    });

    await prisma.cliente.update({
        where: { id: cliente.id },
        data: { saldo: nuevoSaldo }
    });

    if (cargosGenerados >= maxCargos) {
        console.warn(`Cliente ${cliente.id} alcanzó el límite de 12 cargos generados. Puede requerir revisión manual.`);
    }

    return { cargosGenerados, limiteAlcanzado: cargosGenerados >= maxCargos, nuevoSaldo, nuevoVencimiento: currentVencimiento };
}

module.exports = { asegurarCargosAlDia };
