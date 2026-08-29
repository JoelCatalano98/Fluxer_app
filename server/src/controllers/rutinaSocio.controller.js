const prisma = require('../config/prisma');

// GET /api/socio/rutinas/:clienteId
const obtenerRutinasSocio = async (req, res) => {
    try {
        const clienteId = parseInt(req.params.clienteId);
        
        if (isNaN(clienteId)) {
            return res.status(400).json({ success: false, message: 'ID de cliente inválido' });
        }

        const rutinas = await prisma.rutina.findMany({
            where: {
                OR: [
                    { clienteId: null },
                    { clienteId: clienteId }
                ]
            },
            include: { ejercicios: true },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({
            success: true,
            data: rutinas,
            message: 'Rutinas obtenidas con éxito'
        });
    } catch (error) {
        console.error('Error al obtener rutinas:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener rutinas'
        });
    }
};

// PUT /api/socio/rutinas/ejercicio/:ejercicioId
const actualizarPesoEjercicio = async (req, res) => {
    try {
        const ejercicioId = parseInt(req.params.ejercicioId);
        const { pesoReal, notas } = req.body;
        const usuarioId = req.user.id; // From verifyToken middleware

        if (isNaN(ejercicioId)) {
            return res.status(400).json({ success: false, message: 'ID de ejercicio inválido' });
        }
        
        if (pesoReal === undefined || pesoReal === null) {
            return res.status(400).json({ success: false, message: 'El campo pesoReal es obligatorio' });
        }

        // Obtener el ejercicio junto con su rutina para validar propiedad
        const ejercicioExistente = await prisma.rutinaEjercicio.findUnique({
            where: { id: ejercicioId },
            include: { rutina: true }
        });

        if (!ejercicioExistente) {
            return res.status(404).json({ success: false, message: 'Ejercicio no encontrado' });
        }

        if (ejercicioExistente.rutina.clienteId === null) {
            return res.status(403).json({ success: false, message: 'No puedes editar la rutina general del gimnasio' });
        }

        if (ejercicioExistente.rutina.clienteId !== usuarioId) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para editar esta rutina' });
        }

        const actualizado = await prisma.rutinaEjercicio.update({
            where: { id: ejercicioId },
            data: { 
                pesoReal: String(pesoReal),
                notas: notas !== undefined ? String(notas) : undefined
            }
        });

        return res.status(200).json({
            success: true,
            data: actualizado,
            message: 'Ejercicio actualizado correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar ejercicio:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Ejercicio no encontrado' });
        }
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al actualizar el peso'
        });
    }
};

module.exports = {
    obtenerRutinasSocio,
    actualizarPesoEjercicio
};
