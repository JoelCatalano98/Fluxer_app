const prisma = require('../config/prisma');

// Crear una rutina con días y ejercicios
const crearRutina = async (req, res) => {
    try {
        const { nombre, descripcion, clienteId, dias } = req.body;

        if (!nombre || !clienteId || !dias || !Array.isArray(dias)) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos o el formato es incorrecto.'
            });
        }

        const nuevaRutina = await prisma.rutina.create({
            data: {
                nombre,
                descripcion,
                clienteId: parseInt(clienteId),
                dias: {
                    create: dias.map(dia => ({
                        nombre: dia.nombre,
                        ejercicios: {
                            create: dia.ejercicios.map(ej => ({
                                nombre: ej.nombre,
                                series: parseInt(ej.series),
                                repeticiones: ej.repeticiones,
                                descanso: ej.descanso,
                                pesoSugerido: ej.pesoSugerido,
                                notas: ej.notas,
                                videoUrl: ej.videoUrl
                            }))
                        }
                    }))
                }
            },
            include: {
                dias: {
                    include: {
                        ejercicios: true
                    }
                }
            }
        });

        res.status(201).json({
            success: true,
            data: nuevaRutina,
            message: 'Rutina creada exitosamente'
        });
    } catch (error) {
        console.error('Error al crear rutina:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al crear la rutina'
        });
    }
};

// Obtener todas las rutinas de un cliente específico
const obtenerRutinasPorCliente = async (req, res) => {
    try {
        const { clienteId } = req.params;

        const rutinas = await prisma.rutina.findMany({
            where: {
                clienteId: parseInt(clienteId)
            },
            include: {
                dias: {
                    include: {
                        ejercicios: true
                    }
                }
            },
            orderBy: {
                fechaInicio: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            data: rutinas,
            message: 'Rutinas obtenidas exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener rutinas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al obtener las rutinas'
        });
    }
};

// Eliminar una rutina
const eliminarRutina = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.rutina.delete({
            where: {
                id: parseInt(id)
            }
        });

        res.status(200).json({
            success: true,
            message: 'Rutina eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar rutina:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al eliminar la rutina'
        });
    }
};

module.exports = {
    crearRutina,
    obtenerRutinasPorCliente,
    eliminarRutina
};
