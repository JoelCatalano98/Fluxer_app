const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

// GET /api/clientes
// Lista todos los clientes con paginación básica (query params: page, limit)
// e incluye el plan relacionado. Admite filtrar por:
// - filtro=socios -> es_socio = true
// - filtro=socios_activos -> es_socio = true AND estado_cliente = 'ACTIVO'
// - filtro=morosos -> estado_pago = 'MOROSO'
const getClientes = async (req, res) => {
    try {
        const { page, limit, filtro } = req.query;

        // Paginación básica
        const p = parseInt(page) || 1;
        const l = parseInt(limit) || 10;
        const skip = (p - 1) * l;
        const take = l;

        // Construir condiciones de filtrado
        const where = {};
        if (filtro === 'socios') {
            where.es_socio = true;
        } else if (filtro === 'socios_activos') {
            where.es_socio = true;
            where.estado_cliente = 'ACTIVO';
        } else if (filtro === 'morosos') {
            const { asegurarCargosAlDia } = require('../services/cargos.service');
            const hoy = new Date();
            const clientesAtrasados = await prisma.cliente.findMany({
                where: { 
                    estado_cliente: 'ACTIVO',
                    vencimientoCuota: { lt: hoy } 
                },
                select: { id: true }
            });
            for (const c of clientesAtrasados) {
                await asegurarCargosAlDia(c.id);
            }
            where.saldo = { lt: 0 };
        }

        // Excluir a los PENDIENTES por defecto a menos que un filtro ya lo restrinja
        if (!where.estado_cliente) {
            where.estado_cliente = { not: 'PENDIENTE' };
        }

        // Obtener cantidad total y registros paginados con su plan
        const [total, clientes] = await prisma.$transaction([
            prisma.cliente.count({ where }),
            prisma.cliente.findMany({
                where,
                skip,
                take,
                include: {
                    categoria: true,
                    plan: true
                },
                orderBy: {
                    id: 'desc'
                }
            })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                clientes: clientes.map(c => ({
                    ...c,
                    plan: c.plan || null
                })),
                total,
                page: p,
                limit: l,
                totalPages: Math.ceil(total / l)
            },
            message: 'Clientes obtenidos con éxito'
        });
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al obtener clientes'
        });
    }
};

// POST /api/clientes
// Crea un cliente nuevo. Requeridos: nombre, apellido, dni_cuit. codigo_socio requerido si es_socio es true.
const createCliente = async (req, res) => {
    try {
        const {
            codigo_socio,
            nombre,
            apellido,
            dni_cuit,
            email,
            telefono,
            fecha_inicio,
            observaciones,
            estado_pago,
            estado_cliente,
            es_socio,
            categoriaId,
            planId
        } = req.body;

        const isSocio = es_socio === true || es_socio === 'true';

        // Validar campos obligatorios
        if (!nombre || !apellido || !dni_cuit) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'Los campos nombre, apellido y dni_cuit son obligatorios'
            });
        }

        // Validar enums
        if (estado_pago && !['ALDIA', 'MOROSO'].includes(estado_pago)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'El estado de pago no es válido. Valores permitidos: ALDIA, MOROSO'
            });
        }
        if (estado_cliente && !['ACTIVO', 'INACTIVO'].includes(estado_cliente)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'El estado de cliente no es válido. Valores permitidos: ACTIVO, INACTIVO'
            });
        }

        // Obtener configuración financiera para el vencimiento
        let initialVencimiento = null;
        let defaultPassword = null;
        if (isSocio) {
            const baseDate = fecha_inicio ? new Date(fecha_inicio) : new Date();
            initialVencimiento = new Date(baseDate);
            initialVencimiento.setHours(0, 0, 0, 0);
            defaultPassword = await bcrypt.hash('123456', 10);
        }

        // Crear registro en la base de datos
        let nuevoCliente = await prisma.cliente.create({
            data: {
                nombre,
                apellido,
                dni_cuit,
                email: email || null,
                telefono: telefono || null,
                fecha_inicio: isSocio && fecha_inicio ? new Date(fecha_inicio) : null,
                observaciones: observaciones || null,
                estado_pago: estado_pago || 'ALDIA',
                estado_cliente: estado_cliente || 'INACTIVO',
                es_socio: isSocio,
                categoriaId: categoriaId ? parseInt(categoriaId) : null,
                planId: planId ? parseInt(planId) : null,
                vencimientoCuota: initialVencimiento,
                password: defaultPassword
            },
            include: {
                categoria: true,
                plan: true
            }
        });

        // Si es socio, autogeneramos el código basado en su nuevo ID
        if (isSocio) {
            nuevoCliente = await prisma.cliente.update({
                where: { id: nuevoCliente.id },
                data: { codigo_socio: String(nuevoCliente.id).padStart(4, '0') },
                include: {
                    categoria: true,
                    plan: true
                }
            });
        }

        return res.status(201).json({
            success: true,
            data: nuevoCliente,
            message: 'Cliente creado con éxito'
        });
    } catch (error) {
        console.error('Error al crear cliente:', error);

        // Errores de restricción de unicidad en Prisma
        if (error.code === 'P2002') {
            const targets = error.meta?.target || 'campos únicos';
            return res.status(400).json({
                success: false,
                data: null,
                message: `Conflicto de datos duplicados en: ${targets}. Por favor verifica el código de socio, DNI/CUIT o Email.`
            });
        }

        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al crear el cliente'
        });
    }
};

// PUT /api/clientes/:id
// Actualiza todos los campos editables del cliente.
const updateCliente = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'ID de cliente no válido'
            });
        }

        const {
            codigo_socio,
            nombre,
            apellido,
            dni_cuit,
            email,
            telefono,
            fecha_inicio,
            observaciones,
            estado_pago,
            estado_cliente,
            es_socio,
            categoriaId,
            planId
        } = req.body;

        const isSocio = es_socio === true || es_socio === 'true';

        // Obtener el cliente actual para verificar si ya tiene código u otros datos
        const clienteActual = await prisma.cliente.findUnique({ where: { id } });
        if (!clienteActual) {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Cliente no encontrado'
            });
        }

        // Validar que los campos obligatorios no se envíen vacíos
        if (nombre === '' || apellido === '' || dni_cuit === '') {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'Los campos obligatorios (nombre, apellido, dni_cuit) no pueden estar vacíos'
            });
        }

        // Validar enums si se especifican
        if (estado_pago && !['ALDIA', 'MOROSO'].includes(estado_pago)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'El estado de pago no es válido. Valores permitidos: ALDIA, MOROSO'
            });
        }
        if (estado_cliente && !['ACTIVO', 'INACTIVO'].includes(estado_cliente)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'El estado de cliente no es válido. Valores permitidos: ACTIVO, INACTIVO'
            });
        }

        // Construir datos de actualización dinámicamente
        const updateData = {};
        if (nombre !== undefined) updateData.nombre = nombre;
        if (apellido !== undefined) updateData.apellido = apellido;
        if (dni_cuit !== undefined) updateData.dni_cuit = dni_cuit;
        if (email !== undefined) updateData.email = email || null;
        if (telefono !== undefined) updateData.telefono = telefono || null;
        if (observaciones !== undefined) updateData.observaciones = observaciones || null;
        if (estado_pago !== undefined) updateData.estado_pago = estado_pago;
        if (estado_cliente !== undefined) updateData.estado_cliente = estado_cliente;
        
        if (es_socio !== undefined) {
            updateData.es_socio = isSocio;
            if (!isSocio) {
                updateData.codigo_socio = null;
                updateData.fecha_inicio = null;
            } else {
                if (!clienteActual.codigo_socio) {
                    updateData.codigo_socio = String(id).padStart(4, '0');
                }
                if (!clienteActual.password) {
                    updateData.password = await bcrypt.hash('123456', 10);
                }
                if (fecha_inicio !== undefined) updateData.fecha_inicio = fecha_inicio ? new Date(fecha_inicio) : null;
            }
        } else {
            if (fecha_inicio !== undefined) updateData.fecha_inicio = fecha_inicio ? new Date(fecha_inicio) : null;
        }

        if (categoriaId !== undefined) {
            updateData.categoriaId = categoriaId ? parseInt(categoriaId) : null;
        }

        if (planId !== undefined) {
            updateData.planId = planId ? parseInt(planId) : null;
        }

        const clienteActualizado = await prisma.cliente.update({
            where: { id },
            data: updateData,
            include: {
                categoria: true,
                plan: true
            }
        });

        return res.status(200).json({
            success: true,
            data: clienteActualizado,
            message: 'Cliente actualizado con éxito'
        });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);

        // Registro no encontrado
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Cliente no encontrado'
            });
        }

        // Conflicto de unicidad
        if (error.code === 'P2002') {
            const targets = error.meta?.target || 'campos únicos';
            return res.status(400).json({
                success: false,
                data: null,
                message: `Conflicto de datos duplicados en: ${targets}. El código de socio, DNI/CUIT o Email ya está en uso.`
            });
        }

        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al actualizar el cliente'
        });
    }
};

// DELETE /api/clientes/:id
// Baja lógica: no borrar registro, marcar estado_cliente = 'INACTIVO'
const deleteCliente = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'ID de cliente no válido'
            });
        }

        const clienteDesactivado = await prisma.cliente.update({
            where: { id },
            data: {
                estado_cliente: 'INACTIVO'
            },
            include: {
                categoria: true,
                plan: true
            }
        });

        return res.status(200).json({
            success: true,
            data: clienteDesactivado,
            message: 'Cliente dado de baja con éxito'
        });
    } catch (error) {
        console.error('Error al dar de baja cliente:', error);

        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Cliente no encontrado'
            });
        }

        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al dar de baja el cliente'
        });
    }
};

// PATCH /api/clientes/:id/estado-pago
// Actualiza únicamente el campo estado_pago (valores válidos: ALDIA o MOROSO)
const updateEstadoPago = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'ID de cliente no válido'
            });
        }

        const { estado_pago } = req.body;

        // Validar estado de pago
        if (!estado_pago || !['ALDIA', 'MOROSO'].includes(estado_pago)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'El estado de pago no es válido. Valores permitidos: ALDIA, MOROSO'
            });
        }

        const clienteActualizado = await prisma.cliente.update({
            where: { id },
            data: {
                estado_pago
            },
            include: {
                categoria: true,
                plan: true
            }
        });

        return res.status(200).json({
            success: true,
            data: clienteActualizado,
            message: 'Estado de pago actualizado con éxito'
        });
    } catch (error) {
        console.error('Error al actualizar el estado de pago:', error);

        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Cliente no encontrado'
            });
        }

        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al actualizar el estado de pago'
        });
    }
};

// PATCH /api/clientes/:id/reset-password
// Blanquea la contraseña del cliente a "123456" (hasheada con bcrypt)
const resetPasswordCliente = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'ID de cliente no válido'
            });
        }

        const hashedPassword = await bcrypt.hash('123456', 10);

        await prisma.cliente.update({
            where: { id },
            data: { password: hashedPassword }
        });

        return res.status(200).json({
            success: true,
            data: null,
            message: 'Contraseña blanqueada con éxito. Nueva clave: 123456'
        });
    } catch (error) {
        console.error('Error al blanquear contraseña:', error);

        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Cliente no encontrado'
            });
        }

        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al blanquear la contraseña'
        });
    }
};

// GET /api/clientes/:id/movimientos
// Obtiene el saldo actual y el historial de movimientos de un cliente
const getMovimientosCliente = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'ID de cliente no válido'
            });
        }

        const { asegurarCargosAlDia } = require('../services/cargos.service');
        const resultCargos = await asegurarCargosAlDia(id);

        const cliente = await prisma.cliente.findUnique({
            where: { id },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                saldo: true,
                movimientocuenta: {
                    orderBy: { fecha: 'desc' },
                    include: { pago: true }
                }
            }
        });

        if (!cliente) {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Cliente no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                id: cliente.id,
                nombre: cliente.nombre,
                apellido: cliente.apellido,
                saldo: cliente.saldo,
                movimientos: cliente.movimientocuenta
            },
            message: 'Movimientos obtenidos con éxito',
            ...(resultCargos?.limiteAlcanzado && { limiteAlcanzado: true })
        });
    } catch (error) {
        console.error('Error al obtener movimientos del cliente:', error);
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al obtener movimientos'
        });
    }
};

// DELETE /api/clientes/:id/reset-finanzas
// Hard Reset financiero: elimina todos los movimientos y pagos del cliente,
// y resetea su saldo a 0 con estado_pago = 'ALDIA'.
// ⚠️ Operación destructiva e irreversible — solo para uso de SADMIN.
const resetFinanzasCliente = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'ID de cliente no válido'
            });
        }

        // Verificar que el cliente existe antes de proceder
        const clienteExiste = await prisma.cliente.findUnique({ where: { id } });
        if (!clienteExiste) {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Cliente no encontrado'
            });
        }

        // Transacción atómica: eliminar movimientos, pagos y resetear saldo
        await prisma.$transaction([
            prisma.movimientocuenta.deleteMany({ where: { clienteId: id } }),
            prisma.pago.deleteMany({ where: { clienteId: id } }),
            prisma.cliente.update({
                where: { id },
                data: {
                    saldo: 0,
                    estado_pago: 'ALDIA',
                    estado_cliente: 'INACTIVO',
                    vencimientoCuota: new Date(new Date().setHours(0, 0, 0, 0))
                }
            })
        ]);

        return res.status(200).json({
            success: true,
            data: null,
            message: `Reset financiero completado para el cliente ${clienteExiste.nombre} ${clienteExiste.apellido}. Saldo: 0, Pagos eliminados, Movimientos eliminados.`
        });
    } catch (error) {
        console.error('Error al resetear finanzas del cliente:', error);
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al resetear las finanzas del cliente'
        });
    }
};

// GET /api/clientes/pendientes
const getPendientes = async (req, res) => {
    try {
        const pendientes = await prisma.cliente.findMany({
            where: { estado_cliente: 'PENDIENTE' },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                dni_cuit: true,
                email: true,
                telefono: true,
                fecha_inicio: true,
                observaciones: true,
                es_socio: true,
                estado_cliente: true,
                estado_pago: true,
                origenSolicitud: true
            },
            orderBy: { id: 'desc' }
        });
        
        return res.status(200).json({
            success: true,
            data: pendientes,
            message: 'Clientes pendientes obtenidos con éxito'
        });
    } catch (error) {
        console.error('Error al obtener pendientes:', error);
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al obtener clientes pendientes'
        });
    }
};

// PATCH /api/clientes/:id/aprobar
const aprobarCliente = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'ID de cliente no válido'
            });
        }

        const { categoriaId, planId } = req.body;
        
        const clienteActualizado = await prisma.cliente.update({
            where: { id },
            data: {
                estado_cliente: 'ACTIVO',
                categoriaId: categoriaId ? parseInt(categoriaId) : null,
                planId: planId ? parseInt(planId) : null
            }
        });

        return res.status(200).json({
            success: true,
            data: clienteActualizado,
            message: 'Cliente aprobado con éxito'
        });
    } catch (error) {
        console.error('Error al aprobar cliente:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Cliente no encontrado'
            });
        }
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al aprobar cliente'
        });
    }
};

// Rechazar solicitud de PENDIENTE
const rechazarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const clienteId = parseInt(id);

        const cliente = await prisma.cliente.findUnique({
            where: { id: clienteId }
        });

        if (!cliente) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
        }

        const esActualizacion = cliente.observaciones && cliente.observaciones.includes('Completó datos de registro por web/app.');

        if (!esActualizacion) {
            // Es un cliente completamente nuevo
            const pagosCount = await prisma.pago.count({ where: { clienteId } });
            if (pagosCount > 0) {
                await prisma.cliente.update({
                    where: { id: clienteId },
                    data: { estado_cliente: 'INACTIVO', password: null }
                });
            } else {
                await prisma.cliente.delete({ where: { id: clienteId } });
            }
        } else {
            // Era un cliente existente que actualizó datos
            let nuevasObservaciones = cliente.observaciones
                .replace(/ ?\| ?Completó datos de registro por web\/app\./, '')
                .replace(/Completó datos de registro por web\/app\./, '')
                .trim();
            
            if (nuevasObservaciones === '') nuevasObservaciones = null;

            await prisma.cliente.update({
                where: { id: clienteId },
                data: {
                    estado_cliente: 'INACTIVO',
                    password: null, // Le quitamos el acceso
                    observaciones: nuevasObservaciones
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Solicitud rechazada con éxito.'
        });

    } catch (error) {
        console.error('Error al rechazar solicitud:', error);
        return res.status(500).json({
            success: false,
            message: 'Error en el servidor al rechazar la solicitud'
        });
    }
};

module.exports = {
    getClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    updateEstadoPago,
    resetPasswordCliente,
    getMovimientosCliente,
    resetFinanzasCliente,
    getPendientes,
    aprobarCliente,
    rechazarCliente
};
