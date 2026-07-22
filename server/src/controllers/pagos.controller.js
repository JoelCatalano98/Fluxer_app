const prisma = require('../config/prisma');

const obtenerPagos = async (req, res) => {
    try {
        const pagos = await prisma.pago.findMany({
            orderBy: { fecha: 'desc' },
            include: {
                cliente: {
                    select: { nombre: true, apellido: true, dni_cuit: true }
                }
            }
        });
        res.json({ success: true, data: pagos });
    } catch (error) {
        console.error('Error al obtener pagos:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const registrarPago = async (req, res) => {
    try {
        const { clienteId, monto, metodoPago, concepto, notas, estado = 'APROBADO' } = req.body;

        if (!clienteId || monto === undefined || !metodoPago || !concepto) {
            return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
        }

        const clienteIdInt = parseInt(clienteId);

        // Consultar cliente actual
        const cliente = await prisma.cliente.findUnique({
            where: { id: clienteIdInt },
            include: {
                categoria: {
                    include: { plan: true }
                }
            }
        });

        if (!cliente) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
        }

        if (estado === 'APROBADO') {
            // Lógica de cálculo de nueva fecha de vencimiento (30 días)
            let nuevaFechaVencimiento = new Date();
            if (cliente.vencimientoCuota && cliente.vencimientoCuota > new Date()) {
                nuevaFechaVencimiento = new Date(cliente.vencimientoCuota);
            }
            nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + 30);

            const montoPagado = parseFloat(monto);
            const montoPlan = cliente.categoria?.plan?.precio ? parseFloat(cliente.categoria.plan.precio) : 0;
            const diferencia = montoPagado - montoPlan;

            // Transacción para registrar el pago, movimiento y actualizar al cliente
            const [nuevoPago, clienteActualizado] = await prisma.$transaction([
                prisma.pago.create({
                    data: {
                        clienteId: clienteIdInt,
                        monto: montoPagado,
                        metodoPago,
                        concepto,
                        notas,
                        estado: 'APROBADO',
                        movimientos: {
                            create: {
                                monto: montoPagado,
                                tipo: 'INGRESO',
                                descripcion: 'Registro de Pago / Cuota',
                                clienteId: clienteIdInt
                            }
                        }
                    }
                }),
                prisma.cliente.update({
                    where: { id: clienteIdInt },
                    data: {
                        vencimientoCuota: nuevaFechaVencimiento,
                        estado_pago: 'ALDIA', // Actualizamos el estado de pago del cliente a ALDIA
                        saldo: { increment: diferencia }
                    }
                })
            ]);

            return res.status(201).json({ 
                success: true, 
                data: { 
                    pago: nuevoPago, 
                    vencimientoCuota: clienteActualizado.vencimientoCuota 
                } 
            });
        } else if (estado === 'PENDIENTE') {
            const nuevoPago = await prisma.pago.create({
                data: {
                    clienteId: clienteIdInt,
                    monto: parseFloat(monto),
                    metodoPago,
                    concepto,
                    notas,
                    estado: 'PENDIENTE'
                }
            });

            return res.status(201).json({ 
                success: true, 
                data: { 
                    pago: nuevoPago 
                } 
            });
        } else {
            return res.status(400).json({ success: false, message: 'Estado no válido' });
        }
    } catch (error) {
        console.error('Error al registrar pago:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const cambiarEstadoPago = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!estado || !['APROBADO', 'RECHAZADO', 'ANULADO'].includes(estado)) {
            return res.status(400).json({ success: false, message: 'Estado inválido. Debe ser APROBADO, RECHAZADO o ANULADO.' });
        }

        const pagoId = parseInt(id);

        const pagoActual = await prisma.pago.findUnique({
            where: { id: pagoId },
            include: { 
                cliente: {
                    include: {
                        categoria: {
                            include: { plan: true }
                        }
                    }
                } 
            }
        });

        if (!pagoActual) {
            return res.status(404).json({ success: false, message: 'Pago no encontrado.' });
        }

        // --- ANULACIÓN: revertir un pago que ya estaba APROBADO ---
        if (estado === 'ANULADO') {
            if (pagoActual.estado !== 'APROBADO') {
                return res.status(400).json({ success: false, message: 'Solo se pueden anular pagos que estén APROBADOS.' });
            }

            const ayer = new Date(Date.now() - 86400000);
            
            const montoPagadoOriginal = parseFloat(pagoActual.monto);
            const montoPlanOriginal = pagoActual.cliente.categoria?.plan?.precio ? parseFloat(pagoActual.cliente.categoria.plan.precio) : 0;
            const diferenciaOriginal = montoPagadoOriginal - montoPlanOriginal;

            const [pagoAnulado, clienteRevertido] = await prisma.$transaction([
                prisma.pago.update({
                    where: { id: pagoId },
                    data: { estado: 'ANULADO' }
                }),
                prisma.cliente.update({
                    where: { id: pagoActual.clienteId },
                    data: {
                        estado_pago: 'MOROSO',
                        vencimientoCuota: ayer,
                        saldo: { decrement: diferenciaOriginal }
                    }
                }),
                prisma.movimientoCuenta.create({
                    data: {
                        monto: -montoPagadoOriginal,
                        tipo: 'ANULACION',
                        descripcion: `Anulación de Pago #${pagoId}`,
                        clienteId: pagoActual.clienteId,
                        pagoId: pagoId
                    }
                })
            ]);

            return res.json({
                success: true,
                message: 'Pago anulado. El cliente fue marcado como MOROSO y el saldo fue revertido.',
                data: {
                    pago: pagoAnulado,
                    vencimientoCuota: clienteRevertido.vencimientoCuota
                }
            });
        }

        // --- Flujo original: solo permitir cambios desde PENDIENTE ---
        if (pagoActual.estado === 'APROBADO') {
            return res.status(400).json({ success: false, message: 'El pago ya se encuentra aprobado, no se pueden sumar días duplicados.' });
        }

        if (estado === 'APROBADO') {
            const cliente = pagoActual.cliente;
            let nuevaFechaVencimiento = new Date();
            if (cliente.vencimientoCuota && cliente.vencimientoCuota > new Date()) {
                nuevaFechaVencimiento = new Date(cliente.vencimientoCuota);
            }
            nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + 30);

            const montoPagado = parseFloat(pagoActual.monto);
            const montoPlan = cliente.categoria?.plan?.precio ? parseFloat(cliente.categoria.plan.precio) : 0;
            const diferencia = montoPagado - montoPlan;

            const [pagoActualizado, clienteActualizado] = await prisma.$transaction([
                prisma.pago.update({
                    where: { id: pagoId },
                    data: { estado: 'APROBADO' }
                }),
                prisma.cliente.update({
                    where: { id: cliente.id },
                    data: {
                        vencimientoCuota: nuevaFechaVencimiento,
                        estado_pago: 'ALDIA',
                        saldo: { increment: diferencia }
                    }
                }),
                prisma.movimientoCuenta.create({
                    data: {
                        monto: montoPagado,
                        tipo: 'INGRESO',
                        descripcion: 'Aprobación de Pago / Cuota',
                        clienteId: cliente.id,
                        pagoId: pagoId
                    }
                })
            ]);

            return res.json({
                success: true,
                data: {
                    pago: pagoActualizado,
                    vencimientoCuota: clienteActualizado.vencimientoCuota
                }
            });
        } else if (estado === 'RECHAZADO') {
            const pagoActualizado = await prisma.pago.update({
                where: { id: pagoId },
                data: { estado: 'RECHAZADO' }
            });

            return res.json({
                success: true,
                data: {
                    pago: pagoActualizado
                }
            });
        }
    } catch (error) {
        console.error('Error al cambiar estado de pago:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

module.exports = {
    obtenerPagos,
    registrarPago,
    cambiarEstadoPago
};
