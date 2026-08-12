const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const crearLiquidacion = async (req, res) => {
    try {
        const { profesionalId, periodo, clasesSemanales, montoTotal, metodoPago, notas } = req.body;
        
        if (!profesionalId || !periodo || clasesSemanales === undefined || montoTotal === undefined || !metodoPago) {
            return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
        }

        const result = await prisma.$transaction(async (tx) => {
            const existe = await tx.liquidacion.findFirst({
                where: { profesionalId: parseInt(profesionalId), periodo }
            });
            if (existe) {
                throw new Error('Ya existe una liquidación para este profesional en este período');
            }

            const profesional = await tx.profesional.findUnique({
                where: { id: parseInt(profesionalId) }
            });

            if (!profesional) {
                throw new Error('Profesional no encontrado');
            }

            const liquidacion = await tx.liquidacion.create({
                data: {
                    profesionalId: parseInt(profesionalId),
                    periodo,
                    clasesSemanales: parseInt(clasesSemanales),
                    montoTotal: parseFloat(montoTotal),
                    metodoPago,
                    notas
                }
            });

            const descripcion = `Sueldo ${profesional.nombre} ${profesional.apellido} - ${periodo}`;

            const movimiento = await tx.movimientoGeneral.create({
                data: {
                    tipo: 'EGRESO',
                    monto: parseFloat(montoTotal),
                    descripcion,
                    origen: 'LIQUIDACION_SUELDO',
                    liquidacionId: liquidacion.id
                }
            });

            return { liquidacion, movimiento };
        });

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('Error al crear liquidación:', error);
        res.status(400).json({ success: false, message: error.message || 'Error al crear liquidación' });
    }
};

const obtenerLiquidaciones = async (req, res) => {
    try {
        const { profesionalId } = req.query;
        let where = {};
        if (profesionalId) {
            where.profesionalId = parseInt(profesionalId);
        }

        const liquidaciones = await prisma.liquidacion.findMany({
            where,
            include: {
                profesional: {
                    select: {
                        nombre: true,
                        apellido: true
                    }
                }
            },
            orderBy: {
                fechaPago: 'desc'
            }
        });

        res.json({ success: true, data: liquidaciones });
    } catch (error) {
        console.error('Error al obtener liquidaciones:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

module.exports = {
    crearLiquidacion,
    obtenerLiquidaciones
};
