const prisma = require('../config/prisma');

// GET /api/categorias
const getCategorias = async (req, res) => {
    try {
        const categorias = await prisma.categoria.findMany({
            where: { activo: true },
            include: {
                plan: true
            },
            orderBy: {
                id: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            data: categorias,
            message: 'Categorías obtenidas con éxito'
        });
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al obtener categorías'
        });
    }
};

// POST /api/categorias
const createCategoria = async (req, res) => {
    try {
        const { nombre, planId } = req.body;

        if (!nombre) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'El campo nombre es obligatorio'
            });
        }

        const nuevaCategoria = await prisma.categoria.create({
            data: {
                nombre,
                planId: planId ? parseInt(planId) : null,
                activo: true
            },
            include: {
                plan: true
            }
        });

        return res.status(201).json({
            success: true,
            data: nuevaCategoria,
            message: 'Categoría creada con éxito'
        });
    } catch (error) {
        console.error('Error al crear categoría:', error);
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al crear categoría'
        });
    }
};

// PUT /api/categorias/:id
const updateCategoria = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { nombre, planId } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'ID de categoría no válido'
            });
        }

        const dataToUpdate = {};
        if (nombre !== undefined) dataToUpdate.nombre = nombre;
        if (planId !== undefined) dataToUpdate.planId = planId ? parseInt(planId) : null;

        const categoriaActualizada = await prisma.categoria.update({
            where: { id },
            data: dataToUpdate,
            include: {
                plan: true
            }
        });

        return res.status(200).json({
            success: true,
            data: categoriaActualizada,
            message: 'Categoría actualizada con éxito'
        });
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Categoría no encontrada'
            });
        }
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al actualizar categoría'
        });
    }
};

// DELETE /api/categorias/:id
const deleteCategoria = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'ID de categoría no válido'
            });
        }

        // Baja lógica: seteamos activo a false
        await prisma.categoria.update({
            where: { id },
            data: { activo: false }
        });

        return res.status(200).json({
            success: true,
            data: null,
            message: 'Categoría dada de baja con éxito'
        });
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Categoría no encontrada'
            });
        }
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al dar de baja la categoría'
        });
    }
};

module.exports = {
    getCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria
};
