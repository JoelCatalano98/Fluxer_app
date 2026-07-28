const prisma = require('../config/prisma');

const getLiquidacion = async (req, res) => {
    try {
        const profesionales = await prisma.profesional.findMany({
            where: { activo: true },
            include: {
                horarios: {
                    where: { activo: true }
                }
            }
        });

        const liquidacion = profesionales.map(prof => {
            const cantidadHorarios = prof.horarios.length;
            const clasesMensuales = cantidadHorarios * 4;
            const totalAPagar = clasesMensuales * (prof.tarifaPorClase || 0);

            return {
                id: prof.id,
                nombre: prof.nombre,
                apellido: prof.apellido,
                dni: prof.dni,
                tarifaPorClase: prof.tarifaPorClase || 0,
                cantidadHorarios,
                clasesMensuales,
                totalAPagar
            };
        });

        return res.status(200).json({
            success: true,
            data: liquidacion,
            message: 'Liquidación de sueldos obtenida con éxito'
        });
    } catch (error) {
        console.error('Error al obtener liquidación de sueldos:', error);
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al obtener la liquidación'
        });
    }
};

module.exports = {
    getLiquidacion
};
