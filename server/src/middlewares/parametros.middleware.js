const prisma = require('../config/prisma');

const requireParametro = (clave) => {
    return async (req, res, next) => {
        try {
            const param = await prisma.parametroSistema.findUnique({
                where: { clave }
            });
            if (!param || param.valor !== 'true') {
                return res.status(403).json({
                    success: false,
                    message: `Módulo deshabilitado (${clave})`
                });
            }
            next();
        } catch (error) {
            console.error(`Error al verificar parámetro ${clave}:`, error);
            next();
        }
    };
};

module.exports = { requireParametro };
