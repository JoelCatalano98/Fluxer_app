const prisma = require('../config/prisma');

// Crear una rutina con días y ejercicios
const crearRutina = async (req, res) => {
    try {
        const { nombre, clienteId, ejercicios } = req.body;

        if (!nombre || !clienteId || !ejercicios || !Array.isArray(ejercicios)) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos o el formato es incorrecto.'
            });
        }

        const nuevaRutina = await prisma.rutina.create({
            data: {
                nombre,
                clienteId: parseInt(clienteId),
                ejercicios: {
                    create: ejercicios.map(ej => ({
                        nombreEjercicio: ej.nombreEjercicio || ej.nombre, // fallback if frontend sends 'nombre'
                        dia: ej.dia || null,
                        series: parseInt(ej.series),
                        repeticiones: String(ej.repeticiones),
                        pesoSugerido: ej.pesoSugerido ? String(ej.pesoSugerido) : null,
                        notas: ej.notas ? String(ej.notas) : null
                    }))
                }
            },
            include: {
                ejercicios: true
            }
        });

        res.status(201).json({
            success: true,
            data: nuevaRutina,
            message: 'Rutina creada exitosamente'
        });
    } catch (error) {
        console.error('Error al crear rutina:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al crear la rutina'
        });
    }
};

// Obtener todas las rutinas de un cliente específico
const obtenerRutinasPorCliente = async (req, res) => {
    try {
        const { clienteId } = req.params;

        const rutinas = await prisma.rutina.findMany({
            where: {
                clienteId: parseInt(clienteId)
            },
            include: {
                ejercicios: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            data: rutinas,
            message: 'Rutinas obtenidas exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener rutinas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al obtener las rutinas'
        });
    }
};

// Actualizar una rutina específica
const actualizarRutina = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, ejercicios } = req.body;

        if (!nombre || !ejercicios || !Array.isArray(ejercicios)) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos o el formato es incorrecto.'
            });
        }

        // Usamos transacción para asegurar consistencia
        const rutinaActualizada = await prisma.$transaction(async (tx) => {
            // Eliminar ejercicios anteriores
            await tx.rutinaEjercicio.deleteMany({
                where: { rutinaId: parseInt(id) }
            });

            // Actualizar nombre — reescrito como updateMany para incluir branchId en where.
            // tx no hereda la Prisma Extension (limitación documentada del SDK),
            // por eso el filtro de branch se aplica manualmente acá.
            const rutinaId = parseInt(id);
            const whereClause = req.branchId
                ? { id: rutinaId, branchId: req.branchId }
                : { id: rutinaId };

            const updateResult = await tx.rutina.updateMany({
                where: whereClause,
                data: { nombre }
            });

            if (updateResult.count === 0) {
                const err = new Error(`Rutina no encontrada en esta sucursal`);
                err.code = 'P2025';
                throw err;
            }

            // Crear nuevos ejercicios y retornar la rutina completa
            await tx.rutinaEjercicio.createMany({
                data: ejercicios.map(ej => ({
                    rutinaId,
                    nombreEjercicio: ej.nombreEjercicio || ej.nombre,
                    dia: ej.dia || null,
                    series: parseInt(ej.series) || 0,
                    repeticiones: String(ej.repeticiones || ''),
                    pesoSugerido: ej.pesoSugerido ? String(ej.pesoSugerido) : null,
                    notas: ej.notas ? String(ej.notas) : null
                }))
            });

            return await tx.rutina.findUnique({
                where: { id: rutinaId },
                include: { ejercicios: true }
            });
        });

        res.status(200).json({
            success: true,
            data: rutinaActualizada,
            message: 'Rutina actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar rutina:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al actualizar la rutina'
        });
    }
};

// Eliminar una rutina
const eliminarRutina = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.rutina.delete({
            where: {
                id: parseInt(id)
            }
        });

        res.status(200).json({
            success: true,
            message: 'Rutina eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar rutina:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al eliminar la rutina'
        });
    }
};

// Obtener la rutina general (clienteId = null)
const obtenerRutinaGeneral = async (req, res) => {
    try {
        const rutina = await prisma.rutina.findFirst({
            where: { clienteId: null },
            include: { ejercicios: true }
        });
        
        // Retornamos la rutina en un array para mantener compatibilidad con ModalRutinas (que espera array)
        res.status(200).json({
            success: true,
            data: rutina ? [rutina] : [],
            message: 'Rutina general obtenida'
        });
    } catch (error) {
        console.error('Error al obtener rutina general:', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

// Crear o actualizar la rutina general garantizando unicidad
const crearOActualizarRutinaGeneral = async (req, res) => {
    try {
        const { nombre, ejercicios } = req.body;

        if (!nombre || !ejercicios || !Array.isArray(ejercicios)) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
        }

        // 1. Garantizar que exista una sola fila con clienteId = null mediante raw query atómica
        await prisma.$executeRaw`
            INSERT INTO rutinas (nombre, clienteId, createdAt)
            SELECT ${nombre}, NULL, NOW()
            FROM DUAL
            WHERE NOT EXISTS (SELECT 1 FROM rutinas WHERE clienteId IS NULL);
        `;

        // 2. Traer la rutina general asegurada
        const rutinaGeneral = await prisma.rutina.findFirst({
            where: { clienteId: null }
        });

        if (!rutinaGeneral) {
            throw new Error('No se pudo asegurar la rutina general');
        }

        // 3. Actualizar la rutina en transacción (borramos ejercicios viejos y ponemos los nuevos)
        const rutinaActualizada = await prisma.$transaction(async (tx) => {
            // Eliminar ejercicios viejos
            await tx.rutinaEjercicio.deleteMany({
                where: { rutinaId: rutinaGeneral.id }
            });

            // Actualizar nombre — mismo patrOn que actualizarRutina:
            // tx no hereda la extension, branchId se aplica manualmente.
            // rutinaGeneral es la rutina global (clienteId: null) — puede tener branchId null.
            const whereClause = req.branchId
                ? { id: rutinaGeneral.id, branchId: req.branchId }
                : { id: rutinaGeneral.id };

            const updateResult = await tx.rutina.updateMany({
                where: whereClause,
                data: { nombre }
            });

            if (updateResult.count === 0) {
                const err = new Error('Rutina general no encontrada en esta sucursal');
                err.code = 'P2025';
                throw err;
            }

            await tx.rutinaEjercicio.createMany({
                data: ejercicios.map(ej => ({
                    rutinaId: rutinaGeneral.id,
                    nombreEjercicio: ej.nombreEjercicio || ej.nombre,
                    dia: ej.dia || null,
                    series: parseInt(ej.series) || 0,
                    repeticiones: String(ej.repeticiones || ''),
                    pesoSugerido: ej.pesoSugerido ? String(ej.pesoSugerido) : null
                }))
            });

            return await tx.rutina.findUnique({
                where: { id: rutinaGeneral.id },
                include: { ejercicios: true }
            });
        });

        res.status(200).json({
            success: true,
            data: rutinaActualizada,
            message: 'Rutina general actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar rutina general:', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

module.exports = {
    crearRutina,
    obtenerRutinasPorCliente,
    eliminarRutina,
    obtenerRutinaGeneral,
    crearOActualizarRutinaGeneral,
    actualizarRutina
};
