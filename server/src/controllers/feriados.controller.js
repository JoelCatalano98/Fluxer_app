const prisma = require('../config/prisma');

const getFeriados = async (req, res) => {
    try {
        const feriados = await prisma.feriado.findMany({
            orderBy: { fechaInicio: 'asc' }
        });
        res.json(feriados);
    } catch (error) {
        console.error('Error al obtener feriados:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const createFeriado = async (req, res) => {
    const { fechaInicio, fechaFin, motivo } = req.body;

    if (!fechaInicio || !fechaFin || !motivo) {
        return res.status(400).json({ error: 'Los campos fechaInicio, fechaFin y motivo son obligatorios' });
    }

    try {
        const nuevoFeriado = await prisma.feriado.create({
            data: {
                fechaInicio,
                fechaFin,
                motivo
            }
        });
        res.json(nuevoFeriado);
    } catch (error) {
        console.error('Error al crear feriado:', error);
        res.status(500).json({ error: 'Error al registrar el feriado' });
    }
};

const deleteFeriado = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.feriado.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Feriado eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar feriado:', error);
        res.status(500).json({ error: 'Error al eliminar el feriado' });
    }
};

module.exports = {
    getFeriados,
    createFeriado,
    deleteFeriado
};
