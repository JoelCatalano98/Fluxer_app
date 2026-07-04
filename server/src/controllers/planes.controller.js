const prisma = require('../config/prisma');

// GET /api/planes
// Obtiene todos los planes activos
const getPlanes = async (req, res) => {
    try {
        const planes = await prisma.plan.findMany({
            where: { activo: true },
            orderBy: {
                id: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            data: planes,
            message: 'Planes obtenidos con éxito'
        });
    } catch (error) {
        console.error('Error al obtener planes:', error);
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al obtener planes'
        });
    }
};

// GET /api/planes/:id
// Obtiene un plan por ID
const getPlanById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'ID de plan no válido'
            });
        }

        const plan = await prisma.plan.findUnique({
            where: { id }
        });

        if (!plan || !plan.activo) {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Plan no encontrado o inactivo'
            });
        }

        return res.status(200).json({
            success: true,
            data: plan,
            message: 'Plan obtenido con éxito'
        });
    } catch (error) {
        console.error('Error al obtener plan:', error);
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al obtener plan'
        });
    }
};

// POST /api/planes
// Crea un nuevo plan
const createPlan = async (req, res) => {
    try {
        const {
            nombre,
            etiqueta,
            precio,
            frecuencia,
            caracteristicas,
            observaciones
        } = req.body;

        // Validar campos obligatorios
        if (!nombre || !precio || !frecuencia) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'Los campos nombre, precio y frecuencia son obligatorios'
            });
        }

        // Generar código de plan secuencial único (ej. #PLN-001)
        const ultimoPlan = await prisma.plan.findFirst({
            orderBy: { id: 'desc' }
        });
        const proximoId = ultimoPlan ? ultimoPlan.id + 1 : 1;
        const codigo = `#PLN-${String(proximoId).padStart(3, '0')}`;

        const nuevoPlan = await prisma.plan.create({
            data: {
                codigo,
                nombre,
                etiqueta: etiqueta || null,
                precio: parseFloat(precio),
                frecuencia,
                caracteristicas: caracteristicas || null,
                observaciones: observaciones || null,
                activo: true
            }
        });

        return res.status(201).json({
            success: true,
            data: nuevoPlan,
            message: 'Plan registrado con éxito'
        });
    } catch (error) {
        console.error('Error al crear plan:', error);
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al registrar el plan'
        });
    }
};

// PUT /api/planes/:id
// Actualiza un plan por ID
const updatePlan = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'ID de plan no válido'
            });
        }

        const {
            nombre,
            etiqueta,
            precio,
            frecuencia,
            caracteristicas,
            observaciones,
            activo
        } = req.body;

        // Validar campos obligatorios no vacíos
        if (nombre === '' || precio === '' || frecuencia === '') {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'Los campos nombre, precio y frecuencia no pueden estar vacíos'
            });
        }

        const updateData = {};
        if (nombre !== undefined) updateData.nombre = nombre;
        if (etiqueta !== undefined) updateData.etiqueta = etiqueta || null;
        if (precio !== undefined) updateData.precio = parseFloat(precio);
        if (frecuencia !== undefined) updateData.frecuencia = frecuencia;
        if (caracteristicas !== undefined) updateData.caracteristicas = caracteristicas || null;
        if (observaciones !== undefined) updateData.observaciones = observaciones || null;
        if (activo !== undefined) updateData.activo = activo;

        const planActualizado = await prisma.plan.update({
            where: { id },
            data: updateData
        });

        return res.status(200).json({
            success: true,
            data: planActualizado,
            message: 'Plan actualizado con éxito'
        });
    } catch (error) {
        console.error('Error al actualizar plan:', error);

        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Plan no encontrado'
            });
        }

        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al actualizar el plan'
        });
    }
};

// DELETE /api/planes/:id
// Dar de baja lógica un plan por ID (activo = false)
const deletePlan = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'ID de plan no válido'
            });
        }

        const planDesactivado = await prisma.plan.update({
            where: { id },
            data: {
                activo: false
            }
        });

        return res.status(200).json({
            success: true,
            data: planDesactivado,
            message: 'Plan dado de baja con éxito'
        });
    } catch (error) {
        console.error('Error al dar de baja plan:', error);

        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Plan no encontrado'
            });
        }

        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al dar de baja el plan'
        });
    }
};

module.exports = {
    getPlanes,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan
};
