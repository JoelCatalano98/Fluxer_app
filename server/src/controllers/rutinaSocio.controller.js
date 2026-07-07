const prisma = require('../config/prisma');

// GET /api/socio/rutinas/:clienteId
const obtenerRutinasSocio = async (req, res) => {
    try {
        const clienteId = parseInt(req.params.clienteId);
        
        if (isNaN(clienteId)) {
            return res.status(400).json({ success: false, message: 'ID de cliente inválido' });
        }

        const rutinas = await prisma.rutina.findMany({
            where: { clienteId: clienteId },
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
        const { pesoReal } = req.body;

        if (isNaN(ejercicioId)) {
            return res.status(400).json({ success: false, message: 'ID de ejercicio inválido' });
        }
        
        if (pesoReal === undefined || pesoReal === null) {
            return res.status(400).json({ success: false, message: 'El campo pesoReal es obligatorio' });
        }

        const actualizado = await prisma.rutinaEjercicio.update({
            where: { id: ejercicioId },
            data: { pesoReal: parseFloat(pesoReal) }
        });

        return res.status(200).json({
            success: true,
            data: actualizado,
            message: 'Peso registrado correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar peso:', error);
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
