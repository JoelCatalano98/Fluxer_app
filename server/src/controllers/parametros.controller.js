const prisma = require('../config/prisma');

const getParametros = async (req, res) => {
    try {
        const parametros = await prisma.parametroSistema.findMany();
        return res.status(200).json({
            success: true,
            data: parametros
        });
    } catch (error) {
        console.error('Error al obtener parametros:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

const updateParametro = async (req, res) => {
    try {
        const { clave } = req.params;
        const { valor } = req.body;
        
        const parametro = await prisma.parametroSistema.findUnique({ where: { clave } });
        if (!parametro) {
            return res.status(404).json({ success: false, message: 'Parámetro no encontrado' });
        }

        const updated = await prisma.parametroSistema.update({
            where: { clave },
            data: { valor }
        });

        return res.status(200).json({
            success: true,
            data: updated,
            message: 'Parámetro actualizado'
        });
    } catch (error) {
        console.error('Error al actualizar parametro:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    getParametros,
    updateParametro
};
