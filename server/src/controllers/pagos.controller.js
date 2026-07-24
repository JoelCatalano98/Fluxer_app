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
        const { clienteId, monto, montoAbonado, saldoUsado = 0, metodoPago, concepto, notas, estado = 'APROBADO' } = req.body;

        if (!clienteId || (monto === undefined && montoAbonado === undefined) || !metodoPago || !concepto) {
            return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
        }

        const clienteIdInt = parseInt(clienteId);
        const saldoUsadoFloat = parseFloat(saldoUsado) || 0;

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

        // Validación de seguridad: el saldoUsado no puede exceder el saldo real del cliente
        if (saldoUsadoFloat > 0 && saldoUsadoFloat > parseFloat(cliente.saldo)) {
            return res.status(400).json({
                success: false,
                message: `El saldo a usar ($${saldoUsadoFloat}) excede el saldo real del cliente ($${cliente.saldo}).`
            });
        }

        if (estado === 'APROBADO') {
            // Compatibilidad: si viene 'monto' (flujo legacy), usarlo; si viene 'montoAbonado', calcular total
            const montoEfectivo = montoAbonado !== undefined ? parseFloat(montoAbonado) : parseFloat(monto);
            const montoTotalPago = montoEfectivo + saldoUsadoFloat;

            // Lógica de cálculo de nueva fecha de vencimiento (30 días)
            let nuevaFechaVencimiento = new Date();
            if (cliente.vencimientoCuota && cliente.vencimientoCuota > new Date()) {
                nuevaFechaVencimiento = new Date(cliente.vencimientoCuota);
            }
            nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + 30);

            const montoPlan = cliente.categoria?.plan?.precio ? parseFloat(cliente.categoria.plan.precio) : 0;
            // El saldo neto cambia según lo que pagó en efectivo vs el plan.
            // saldoUsado ya era del cliente, se usa para cubrir parte del plan → decrement.
            // Si montoEfectivo > lo que faltaba del plan → genera nuevo saldo a favor.
            const diferenciaNeta = montoTotalPago - montoPlan; // excedente total (podría venir de efectivo)

            // Construir operaciones de la transacción
            const transactionOps = [
                // 1. Crear el Pago con el monto total
                prisma.pago.create({
                    data: {
                        clienteId: clienteIdInt,
                        monto: montoTotalPago,
                        metodoPago: saldoUsadoFloat > 0 ? `${metodoPago} + SALDO` : metodoPago,
                        concepto,
                        notas: saldoUsadoFloat > 0
                            ? `${notas || ''} [Saldo aplicado: $${saldoUsadoFloat}]`.trim()
                            : notas,
                        estado: 'APROBADO',
                        movimientos: {
                            create: {
                                monto: montoTotalPago,
                                tipo: 'INGRESO',
                                descripcion: saldoUsadoFloat > 0
                                    ? `Registro de Pago / Cuota (Efectivo: $${montoEfectivo} + Saldo: $${saldoUsadoFloat})`
                                    : 'Registro de Pago / Cuota',
                                clienteId: clienteIdInt
                            }
                        }
                    }
                }),
                // 2. Actualizar cliente: vencimiento, estado, y ajustar saldo
                //    - Restamos saldoUsado (se consumió de la billetera)
                //    - Sumamos la diferencia neta (excedente si pagó de más)
                //    Neto: increment(diferenciaNeta - saldoUsadoFloat)
                //    Equivalente a: increment(montoEfectivo - montoPlan) cuando saldoUsado se cancela
                prisma.cliente.update({
                    where: { id: clienteIdInt },
                    data: {
                        vencimientoCuota: nuevaFechaVencimiento,
                        estado_pago: 'ALDIA',
                        saldo: { increment: diferenciaNeta - saldoUsadoFloat }
                    }
                })
            ];

            // 3. Si se usó saldo, crear movimiento EGRESO adicional
            if (saldoUsadoFloat > 0) {
                transactionOps.push(
                    prisma.movimientoCuenta.create({
                        data: {
                            monto: -saldoUsadoFloat,
                            tipo: 'EGRESO',
                            descripcion: 'Aplicación de saldo a favor para cuota',
                            clienteId: clienteIdInt
                        }
                    })
                );
            }

            const resultados = await prisma.$transaction(transactionOps);
            const nuevoPago = resultados[0];
            const clienteActualizado = resultados[1];

            return res.status(201).json({ 
                success: true, 
                data: { 
                    pago: nuevoPago, 
                    vencimientoCuota: clienteActualizado.vencimientoCuota,
                    saldoUsado: saldoUsadoFloat,
                    nuevoSaldo: clienteActualizado.saldo
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
