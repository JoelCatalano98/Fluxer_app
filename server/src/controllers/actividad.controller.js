const prisma = require('../config/prisma');

// Obtener todas las actividades
const getActividades = async (req, res) => {
    try {
        const actividades = await prisma.actividad.findMany();
        return res.status(200).json({
            success: true,
            data: actividades
        });
    } catch (error) {
        console.error('Error al obtener actividades:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener actividades'
        });
    }
};

// Crear una nueva actividad
const createActividad = async (req, res) => {
    try {
        const { nombre, color } = req.body;

        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la actividad es obligatorio'
            });
        }

        const nuevaActividad = await prisma.actividad.create({
            data: { nombre, color }
        });

        return res.status(201).json({
            success: true,
            data: nuevaActividad,
            message: 'Actividad creada con éxito'
        });
    } catch (error) {
        console.error('Error al crear actividad:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una actividad con ese nombre'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al crear la actividad'
        });
    }
};

module.exports = {
    getActividades,
    createActividad
};
