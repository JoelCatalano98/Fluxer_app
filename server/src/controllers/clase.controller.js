const prisma = require('../config/prisma');

// Obtener todas las clases
const getClases = async (req, res) => {
    try {
        const clases = await prisma.clase.findMany({
            include: { actividad: true }
        });
        return res.status(200).json({
            success: true,
            data: clases
        });
    } catch (error) {
        console.error('Error al obtener clases:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener clases'
        });
    }
};

// Crear una nueva clase
const createClase = async (req, res) => {
    try {
        const { actividadId, diaSemana, horaInicio, horaFin, cupoMaximo } = req.body;

        if (!actividadId || !diaSemana || !horaInicio || !horaFin) {
            return res.status(400).json({
                success: false,
                message: 'Actividad, día y horarios son obligatorios'
            });
        }

        const nuevaClase = await prisma.clase.create({
            data: {
                actividadId: parseInt(actividadId),
                diaSemana,
                horaInicio,
                horaFin,
                cupoMaximo: cupoMaximo ? parseInt(cupoMaximo) : 15
            },
            include: { actividad: true }
        });

        return res.status(201).json({
            success: true,
            data: nuevaClase,
            message: 'Clase creada con éxito'
        });
    } catch (error) {
        console.error('Error al crear clase:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al crear la clase'
        });
    }
};

module.exports = {
    getClases,
    createClase
};
