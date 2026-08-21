const prisma = require('../config/prisma');

/**
 * Obtiene el rango de fechas para la semana actual basado en los días de apertura configurados.
 * Retorna objetos Date en UTC (medianoche de inicio, fin de día).
 */
const obtenerRangoSemanal = async () => {
    const configuracion = await prisma.configuracion.findFirst();
    const diasApertura = configuracion?.diasApertura || '1,2,3,4,5,6';
    const validos = diasApertura.split(',').map(Number);
    
    let offset = 5; // Default: Sabado (Lunes + 5)
    if (validos.length > 0) {
        if (validos.includes(0)) {
            offset = 6; // Domingo (Lunes + 6)
        } else {
            offset = Math.max(...validos) - 1;
        }
    }

    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1));
    lunes.setHours(0, 0, 0, 0);

    const diaFinal = new Date(lunes);
    diaFinal.setDate(lunes.getDate() + offset);
    diaFinal.setHours(23, 59, 59, 999);

    const startOfRange = new Date(lunes.toISOString().split('T')[0] + 'T00:00:00.000Z');
    const endOfRange = new Date(diaFinal.toISOString().split('T')[0] + 'T23:59:59.999Z');

    return { startOfRange, endOfRange };
};

module.exports = { obtenerRangoSemanal };
