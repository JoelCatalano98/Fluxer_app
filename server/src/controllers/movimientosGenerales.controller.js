const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const crearMovimientoManual = async (req, res) => {
    try {
        const { tipo, monto, descripcion, fecha } = req.body;
        
        if (!tipo || !['INGRESO', 'EGRESO'].includes(tipo) || monto === undefined || !descripcion) {
            return res.status(400).json({ success: false, message: 'Datos obligatorios faltantes o inválidos' });
        }

        const data = {
            tipo,
            monto: parseFloat(monto),
            descripcion,
            origen: 'MANUAL'
        };

        if (fecha) {
            data.fecha = new Date(fecha);
        }

        const movimiento = await prisma.movimientoGeneral.create({
            data
        });

        res.status(201).json({ success: true, data: movimiento });
    } catch (error) {
        console.error('Error al crear movimiento manual:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const obtenerMovimientos = async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        let where = {};
        
        if (desde || hasta) {
            where.fecha = {};
            if (desde) {
                where.fecha.gte = new Date(desde);
            }
            if (hasta) {
                const fechaHasta = new Date(hasta);
                fechaHasta.setHours(23, 59, 59, 999);
                where.fecha.lte = fechaHasta;
            }
        }

        const movimientos = await prisma.movimientoGeneral.findMany({
            where,
            orderBy: {
                fecha: 'desc'
            },
            include: {
                pago: {
                    include: {
                        cliente: {
                            select: { nombre: true, apellido: true }
                        }
                    }
                },
                liquidacion: {
                    include: {
                        profesional: {
                            select: { nombre: true, apellido: true }
                        }
                    }
                }
            }
        });

        res.json({ success: true, data: movimientos });
    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

module.exports = {
    crearMovimientoManual,
    obtenerMovimientos
};
