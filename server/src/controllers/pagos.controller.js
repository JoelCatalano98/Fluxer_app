const prisma = require('../config/prisma');

const obtenerPagos = async (req, res) => {
    try {
        const pagos = await req.db.pago.findMany({
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

const obtenerPagosPendientesCount = async (req, res) => {
    try {
        const count = await req.db.pago.count({
            where: { estado: 'PENDIENTE' }
        });
        res.json({ success: true, count });
    } catch (error) {
        console.error('Error al obtener conteo de pagos pendientes:', error);
        res.status(500).json({ success: false, message: 'Error interno' });
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
        const cliente = await req.db.cliente.findUnique({
            where: { id: clienteIdInt },
            include: {
                plan: true
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
            const { asegurarCargosAlDia } = require('../services/cargos.service');
            await asegurarCargosAlDia(clienteIdInt);

            // Obtener saldo actualizado después de asegurarCargosAlDia
            const clienteActualizado = await req.db.cliente.findUnique({ where: { id: clienteIdInt } });

            const montoEfectivo = montoAbonado !== undefined ? parseFloat(montoAbonado) : parseFloat(monto);
            const montoTotalPago = montoEfectivo + saldoUsadoFloat;

            const saldoProyectado = parseFloat(clienteActualizado.saldo) + montoTotalPago;
            const nuevoEstadoPago = saldoProyectado >= 0 ? 'ALDIA' : 'MOROSO';

            // Construir operaciones de la transacción
            const transactionOps = [
                // 1. Crear el Pago con el monto total
                req.db.pago.create({
                    data: {
                        clienteId: clienteIdInt,
                        monto: montoTotalPago,
                        metodoPago: saldoUsadoFloat > 0 ? `${metodoPago} + SALDO` : metodoPago,
                        concepto,
                        notas: saldoUsadoFloat > 0
                            ? `${notas || ''} [Saldo aplicado: $${saldoUsadoFloat}]`.trim()
                            : notas,
                        estado: 'APROBADO',
                        movimientocuenta: {
                            create: {
                                monto: montoTotalPago,
                                tipo: 'INGRESO',
                                descripcion: saldoUsadoFloat > 0
                                    ? `Registro de Pago / Cuota (Efectivo: $${montoEfectivo} + Saldo: $${saldoUsadoFloat})`
                                    : 'Registro de Pago / Cuota',
                                clienteId: clienteIdInt
                            }
                        },
                        movimientosGenerales: {
                            create: {
                                tipo: 'INGRESO',
                                monto: montoTotalPago,
                                descripcion: `Cuota ${cliente.nombre} ${cliente.apellido} - ${concepto}`,
                                origen: 'PAGO_CLIENTE'
                            }
                        }
                    }
                }),
                // 2. Actualizar estado del cliente
                req.db.cliente.update({
                    where: { id: clienteIdInt },
                    data: {
                        estado_pago: nuevoEstadoPago,
                        ...(cliente.estado_cliente === 'INACTIVO' ? { estado_cliente: 'ACTIVO' } : {})
                    }
                })
            ];

            // 3. Si se usó saldo, crear movimiento EGRESO adicional
            if (saldoUsadoFloat > 0) {
                transactionOps.push(
                    req.db.movimientocuenta.create({
                        data: {
                            monto: -saldoUsadoFloat,
                            tipo: 'EGRESO',
                            descripcion: 'Aplicación de saldo a favor para cuota',
                            clienteId: clienteIdInt
                        }
                    })
                );
            }

            const resultados = await req.db.$transaction(transactionOps);
            const nuevoPago = resultados[0];

            // Recalcular el saldo llamando nuevamente al servicio (actualizará el saldo sumando todo)
            const resultCargos = await asegurarCargosAlDia(clienteIdInt);

            return res.status(201).json({ 
                success: true, 
                data: { 
                    pago: nuevoPago, 
                    vencimientoCuota: resultCargos?.nuevoVencimiento || cliente.vencimientoCuota,
                    saldoUsado: saldoUsadoFloat,
                    nuevoSaldo: resultCargos?.nuevoSaldo || 0,
                    ...(resultCargos?.limiteAlcanzado && { limiteAlcanzado: true })
                } 
            });
        } else if (estado === 'PENDIENTE') {
            const nuevoPago = await req.db.pago.create({
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

        const pagoActual = await req.db.pago.findUnique({
            where: { id: pagoId },
            include: { 
                cliente: {
                    include: {
                        plan: true
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
            const montoPlanOriginal = pagoActual.cliente.plan?.precio ? parseFloat(pagoActual.cliente.plan.precio) : 0;
            const diferenciaOriginal = montoPagadoOriginal - montoPlanOriginal;

            const branchId = req.branchId || null;
            let pagoAnulado, clienteRevertido;
            
            try {
                const resTx = await req.db.$transaction(async (tx) => {
                    const updatedPago = await tx.pago.update({
                        where: { id: pagoId },
                        data: { estado: 'ANULADO' }
                    });

                    const updatedCliente = await tx.cliente.update({
                        where: { id: pagoActual.clienteId },
                        data: {
                            estado_pago: 'MOROSO'
                        }
                    });

                    await tx.movimientocuenta.create({
                        data: {
                            monto: -montoPagadoOriginal,
                            tipo: 'ANULACION',
                            descripcion: `Anulación de Pago #${pagoId}`,
                            clienteId: pagoActual.clienteId,
                            pagoId: pagoId,
                            ...(branchId && { branchId })
                        }
                    });

                    // También se debe anular el movimiento general asociado
                    const movsGen = await tx.movimientoGeneral.findMany({
                        where: { pagoId: pagoId }
                    });

                    for (const mov of movsGen) {
                        await tx.movimientoGeneral.create({
                            data: {
                                tipo: 'EGRESO',
                                monto: mov.monto,
                                descripcion: `Anulación Cuota ${pagoActual.cliente.nombre} ${pagoActual.cliente.apellido}`,
                                origen: 'PAGO_CLIENTE',
                                pagoId: pagoId,
                                ...(branchId && { branchId })
                            }
                        });
                    }

                    return [updatedPago, updatedCliente];
                });
                
                pagoAnulado = resTx[0];
                clienteRevertido = resTx[1];
            } catch (txError) {
                console.error('ERROR EN TRANSACTION DE ANULACION:', txError);
                throw txError;
            }

            const { asegurarCargosAlDia } = require('../services/cargos.service');
            const resultCargos = await asegurarCargosAlDia(pagoActual.clienteId);

            return res.json({
                success: true,
                message: 'Pago anulado. El cliente fue marcado como MOROSO y el saldo fue revertido.',
                data: {
                    pago: pagoAnulado,
                    vencimientoCuota: resultCargos?.nuevoVencimiento || clienteRevertido.vencimientoCuota
                }
            });
        }

        // --- Flujo original: permitir cambios ---

        if (estado === 'APROBADO') {
            const cliente = pagoActual.cliente;
            const { asegurarCargosAlDia } = require('../services/cargos.service');
            await asegurarCargosAlDia(cliente.id);

            // Obtener saldo actualizado después de asegurarCargosAlDia
            const clienteActualizado = await req.db.cliente.findUnique({ where: { id: cliente.id } });

            const montoPagado = parseFloat(pagoActual.monto);
            
            const saldoProyectado = parseFloat(clienteActualizado.saldo) + montoPagado;
            const nuevoEstadoPago = saldoProyectado >= 0 ? 'ALDIA' : 'MOROSO';
            const branchId = req.branchId || null;

            let pagoActualizado;
            try {
                pagoActualizado = await req.db.$transaction(async (tx) => {
                    const updatedPago = await tx.pago.update({
                        where: { id: pagoId },
                        data: { estado: 'APROBADO' }
                    });

                    await tx.cliente.update({
                        where: { id: cliente.id },
                        data: {
                            saldo: saldoProyectado,
                            estado_pago: nuevoEstadoPago,
                            ...(cliente.estado_cliente === 'INACTIVO' ? { estado_cliente: 'ACTIVO' } : {})
                        }
                    });

                    await tx.movimientocuenta.create({
                        data: {
                            monto: montoPagado,
                            tipo: 'INGRESO',
                            descripcion: 'Aprobación de Pago / Cuota',
                            clienteId: cliente.id,
                            pagoId: pagoId,
                            ...(branchId && { branchId })
                        }
                    });

                    await tx.movimientoGeneral.create({
                        data: {
                            tipo: 'INGRESO',
                            monto: montoPagado,
                            descripcion: `Aprobación Cuota ${cliente.nombre} ${cliente.apellido}`,
                            origen: 'PAGO_CLIENTE',
                            pagoId: pagoId,
                            ...(branchId && { branchId })
                        }
                    });

                    return updatedPago;
                });
            } catch (txError) {
                console.error('ERROR EN TRANSACTION:', txError);
                throw txError;
            }

            const resultCargos = await asegurarCargosAlDia(cliente.id);

            return res.json({
                success: true,
                data: {
                    pago: pagoActualizado,
                    vencimientoCuota: resultCargos?.nuevoVencimiento || cliente.vencimientoCuota,
                    ...(resultCargos?.limiteAlcanzado && { limiteAlcanzado: true })
                }
            });
        } else if (estado === 'RECHAZADO') {
            const pagoActualizado = await req.db.pago.update({
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
    obtenerPagosPendientesCount,
    registrarPago,
    cambiarEstadoPago
};
