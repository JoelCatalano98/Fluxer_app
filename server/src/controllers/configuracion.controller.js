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
        const { nombreGimnasio, logoBase64, bloqueoCapacidad, cupoGlobal, limiteCancelacionMinutos, profesoresPorTurno, adminNombre, adminApellido, adminDni, adminEmail, diasApertura, maxReservasSemana } = req.body;
        const diaMaximoCobro = req.body.diaMaximoCobro !== undefined ? parseInt(req.body.diaMaximoCobro, 10) : undefined;
        const recargoPorcentaje = req.body.recargoPorcentaje !== undefined ? parseFloat(req.body.recargoPorcentaje) : undefined;

        // 1. Obtener config vieja para comparar
        const oldConfig = await prisma.configuracion.findUnique({ where: { id: 1 } });
        const oldDiaMaximoCobro = oldConfig?.diaMaximoCobro || 10;

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
                diasApertura,
                maxReservasSemana: parseInt(maxReservasSemana) || 0,
                diaMaximoCobro,
                recargoPorcentaje
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
                diasApertura: diasApertura || '1,2,3,4,5,6',
                maxReservasSemana: parseInt(maxReservasSemana) || 0,
                diaMaximoCobro: diaMaximoCobro || 10,
                recargoPorcentaje: recargoPorcentaje ?? 10.0
            }
        });

        let clientesActualizados = 0;
        if (diaMaximoCobro !== undefined && diaMaximoCobro !== oldDiaMaximoCobro) {
            // Recorrer todos los clientes socios activos
            const clientes = await prisma.cliente.findMany({
                where: {
                    es_socio: true,
                    estado_cliente: 'ACTIVO',
                    vencimientoCuota: { not: null }
                }
            });
            
            for (const cliente of clientes) {
                let v = new Date(cliente.vencimientoCuota);
                const targetMonth = v.getMonth();
                v.setDate(diaMaximoCobro);
                if (v.getMonth() !== targetMonth) {
                    v.setDate(0); // Vuelve al último día del targetMonth
                }
                
                await prisma.cliente.update({
                    where: { id: cliente.id },
                    data: { vencimientoCuota: v }
                });
                clientesActualizados++;
            }
        }

        return res.status(200).json({
            success: true,
            data: config,
            clientesActualizados,
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
