const prisma = require('../config/prisma');

// GET /api/configuracion
const getConfiguracion = async (req, res) => {
    try {
        // Buscamos la configuración con id: 1
        let config = await prisma.configuracion.findUnique({
            where: { id: 1 }
        });

        // Si no existe, creamos una configuración inicial por defecto
        if (!config) {
            config = await prisma.configuracion.create({
                data: {
                    id: 1,
                    nombreGimnasio: 'Fluxer Gym',
                    logoBase64: null,
                    bloqueoCapacidad: false,
                    cupoGlobal: 15,
                    limiteCancelacionMinutos: 60,
                    profesoresPorTurno: false
                }
            });
        }

        return res.status(200).json({
            success: true,
            data: config,
            message: 'Configuración obtenida con éxito'
        });
    } catch (error) {
        console.error('Error al obtener configuración:', error);
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al obtener configuración'
        });
    }
};

// PUT /api/configuracion
const updateConfiguracion = async (req, res) => {
    try {
        const { nombreGimnasio, logoBase64, bloqueoCapacidad, cupoGlobal, limiteCancelacionMinutos, profesoresPorTurno, adminNombre, adminApellido, adminDni, adminEmail, diasApertura } = req.body;

        // Upsert para actualizar o crear la configuración única con id 1
        const config = await prisma.configuracion.upsert({
            where: { id: 1 },
            update: {
                nombreGimnasio,
                logoBase64: logoBase64 === "" ? null : logoBase64,
                bloqueoCapacidad: bloqueoCapacidad === true,
                cupoGlobal: parseInt(cupoGlobal) || 15,
                limiteCancelacionMinutos: parseInt(limiteCancelacionMinutos) || 60,
                profesoresPorTurno: profesoresPorTurno === true,
                adminNombre,
                adminApellido,
                adminDni,
                adminEmail,
                diasApertura
            },
            create: {
                id: 1,
                nombreGimnasio: nombreGimnasio || 'Fluxer Gym',
                logoBase64: logoBase64 === "" ? null : (logoBase64 || null),
                bloqueoCapacidad: bloqueoCapacidad === true,
                cupoGlobal: parseInt(cupoGlobal) || 15,
                limiteCancelacionMinutos: parseInt(limiteCancelacionMinutos) || 60,
                profesoresPorTurno: profesoresPorTurno === true,
                adminNombre,
                adminApellido,
                adminDni,
                adminEmail,
                diasApertura: diasApertura || '1,2,3,4,5,6'
            }
        });

        return res.status(200).json({
            success: true,
            data: config,
            message: 'Configuración actualizada con éxito'
        });
    } catch (error) {
        console.error('Error al actualizar configuración:', error);
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al actualizar configuración'
        });
    }
};

module.exports = {
    getConfiguracion,
    updateConfiguracion
};
