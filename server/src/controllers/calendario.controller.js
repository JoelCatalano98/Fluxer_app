const prisma = require('../config/prisma');

const getNotas = async (req, res) => {
    try {
        const notas = await prisma.calendarioNota.findMany();
        res.json(notas);
    } catch (error) {
        console.error('Error al obtener notas del calendario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const createNota = async (req, res) => {
    const { fecha, contenido, horaAlarma } = req.body;
    if (!fecha || !contenido) {
        return res.status(400).json({ error: 'Los campos fecha y contenido son obligatorios' });
    }
    try {
        const nuevaNota = await prisma.calendarioNota.create({
            data: {
                fecha,
                contenido,
                horaAlarma: horaAlarma || null,
                notificado: false
            }
        });
        res.status(201).json(nuevaNota);
    } catch (error) {
        console.error('Error al crear nota del calendario:', error);
        res.status(500).json({ error: 'Error al registrar la nota' });
    }
};

const updateNota = async (req, res) => {
    const { id } = req.params;
    const { contenido, horaAlarma, notificado } = req.body;
    try {
        const updateData = {};
        if (contenido !== undefined) updateData.contenido = contenido;
        if (horaAlarma !== undefined) updateData.horaAlarma = horaAlarma || null;
        if (notificado !== undefined) updateData.notificado = notificado;

        const notaActualizada = await prisma.calendarioNota.update({
            where: { id: parseInt(id) },
            data: updateData
        });
        res.json(notaActualizada);
    } catch (error) {
        console.error('Error al actualizar nota del calendario:', error);
        res.status(500).json({ error: 'Error al actualizar la nota' });
    }
};

const deleteNota = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.calendarioNota.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Nota eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar nota del calendario:', error);
        res.status(500).json({ error: 'Error al eliminar la nota' });
    }
};

module.exports = {
    getNotas,
    createNota,
    updateNota,
    deleteNota
};
