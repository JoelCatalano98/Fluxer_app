const prisma = require('../config/prisma');

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
            where.estado_pago = 'MOROSO';
        }

        // Obtener cantidad total y registros paginados con su plan
        const [total, clientes] = await prisma.$transaction([
            prisma.cliente.count({ where }),
            prisma.cliente.findMany({
                where,
                skip,
                take,
                include: {
                    categoria: {
                        include: {
                            plan: true
                        }
                    }
                },
                orderBy: {
                    id: 'desc'
                }
            })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                clientes,
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
            categoriaId
        } = req.body;

        const isSocio = es_socio === true || es_socio === 'true';

        // Validar campos obligatorios
        if (!nombre || !apellido || !dni_cuit || (isSocio && !codigo_socio)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: isSocio 
                    ? 'Los campos codigo_socio, nombre, apellido y dni_cuit son obligatorios para socios'
                    : 'Los campos nombre, apellido y dni_cuit son obligatorios'
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

        // Crear registro en la base de datos
        const nuevoCliente = await prisma.cliente.create({
            data: {
                codigo_socio: isSocio ? codigo_socio : null,
                nombre,
                apellido,
                dni_cuit,
                email: email || null,
                telefono: telefono || null,
                fecha_inicio: isSocio && fecha_inicio ? new Date(fecha_inicio) : null,
                observaciones: observaciones || null,
                estado_pago: estado_pago || 'ALDIA',
                estado_cliente: estado_cliente || 'ACTIVO',
                es_socio: isSocio,
                categoriaId: categoriaId ? parseInt(categoriaId) : null
            },
            include: {
                categoria: {
                    include: {
                        plan: true
                    }
                }
            }
        });

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
            categoriaId
        } = req.body;

        const isSocio = es_socio === true || es_socio === 'true';

        // Validar que los campos obligatorios no se envíen vacíos
        if (nombre === '' || apellido === '' || dni_cuit === '' || (isSocio && codigo_socio === '')) {
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
                if (codigo_socio !== undefined) updateData.codigo_socio = codigo_socio;
                if (fecha_inicio !== undefined) updateData.fecha_inicio = fecha_inicio ? new Date(fecha_inicio) : null;
            }
        } else {
            if (codigo_socio !== undefined) updateData.codigo_socio = codigo_socio;
            if (fecha_inicio !== undefined) updateData.fecha_inicio = fecha_inicio ? new Date(fecha_inicio) : null;
        }

        if (categoriaId !== undefined) {
            updateData.categoriaId = categoriaId ? parseInt(categoriaId) : null;
        }

        const clienteActualizado = await prisma.cliente.update({
            where: { id },
            data: updateData,
            include: {
                categoria: {
                    include: {
                        plan: true
                    }
                }
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
                categoria: {
                    include: {
                        plan: true
                    }
                }
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
                categoria: {
                    include: {
                        plan: true
                    }
                }
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

module.exports = {
    getClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    updateEstadoPago
};
