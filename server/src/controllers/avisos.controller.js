const prisma = require('../config/prisma');

const getAvisosAdmin = async (req, res) => {
    try {
        const avisos = await prisma.aviso.findMany({
            orderBy: { fechaDesde: 'desc' }
        });
        res.json(avisos);
    } catch (error) {
        console.error('Error al obtener avisos admin:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getAvisosSocio = async (req, res) => {
    try {
        const hoy = new Date();
        const avisos = await prisma.aviso.findMany({
            where: {
                activo: true,
                OR: [
                    { fechaHasta: { gte: hoy } },
                    { fechaHasta: null }
                ]
            },
            orderBy: { fechaDesde: 'desc' }
        });
        res.json({ success: true, data: avisos });
    } catch (error) {
        console.error('Error al obtener avisos socio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const createAviso = async (req, res) => {
    const { titulo, mensaje, tipo, fechaDesde, fechaHasta } = req.body;
    try {
        const nuevoAviso = await prisma.aviso.create({
            data: {
                titulo,
                mensaje,
                tipo: tipo || 'INFO',
                fechaDesde: new Date(fechaDesde),
                fechaHasta: fechaHasta ? new Date(fechaHasta) : null
            }
        });
        res.json(nuevoAviso);
    } catch (error) {
        console.error('Error al crear aviso:', error);
        res.status(500).json({ error: 'Error al registrar el aviso' });
    }
};

const updateAviso = async (req, res) => {
    const { id } = req.params;
    const { titulo, mensaje, tipo, fechaDesde, fechaHasta, activo } = req.body;
    try {
        const avisoActualizado = await prisma.aviso.update({
            where: { id: parseInt(id) },
            data: {
                titulo,
                mensaje,
                tipo,
                fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
                fechaHasta: fechaHasta !== undefined ? (fechaHasta ? new Date(fechaHasta) : null) : undefined,
                activo
            }
        });
        res.json(avisoActualizado);
    } catch (error) {
        console.error('Error al actualizar aviso:', error);
        res.status(500).json({ error: 'Error al actualizar el aviso' });
    }
};

const deleteAviso = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.aviso.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Aviso eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar aviso:', error);
        res.status(500).json({ error: 'Error al eliminar el aviso' });
    }
};

module.exports = {
    getAvisosAdmin,
    getAvisosSocio,
    createAviso,
    updateAviso,
    deleteAviso
};
