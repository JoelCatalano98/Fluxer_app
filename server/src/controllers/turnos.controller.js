const prisma = require('../config/prisma');

// GET /api/turnos
// Obtener todos los turnos de la semana con filtros de fecha
const getTurnos = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        const where = {};
        if (fechaInicio && fechaFin) {
            where.fecha = {
                gte: new Date(fechaInicio),
                lte: new Date(fechaFin)
            };
        } else {
            // Por defecto, traer los turnos de la semana actual (Lunes a Sábado)
            const hoy = new Date();
            const diaSemana = hoy.getDay(); // 0: Domingo, 1: Lunes, etc.
            
            // Lunes de esta semana
            const lunes = new Date(hoy);
            const diffLunes = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
            lunes.setDate(diffLunes);
            lunes.setHours(0, 0, 0, 0);

            // Sábado de esta semana
            const sabado = new Date(lunes);
            sabado.setDate(lunes.getDate() + 5);
            sabado.setHours(23, 59, 59, 999);

            where.fecha = {
                gte: lunes,
                lte: sabado
            };
        }

        const turnos = await prisma.turnoCliente.findMany({
            where,
            include: {
                cliente: true,
                profesional: true,
                horario: true
            },
            orderBy: {
                id: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            data: turnos,
            message: 'Turnos obtenidos con éxito'
        });
    } catch (error) {
        console.error('Error al obtener turnos:', error);
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al obtener turnos'
        });
    }
};

// POST /api/turnos
// Crear una nueva reserva (turno)
const createTurno = async (req, res) => {
    try {
        const {
            fecha,
            horarioId,
            clienteId,
            profesionalId
        } = req.body;

        // Validar campos obligatorios
        if (!fecha || !horarioId || !clienteId) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'Los campos fecha, horarioId y clienteId son obligatorios'
            });
        }

        // Crear el turno
        const nuevoTurno = await prisma.turnoCliente.create({
            data: {
                fecha: new Date(fecha),
                horarioId: parseInt(horarioId),
                clienteId: parseInt(clienteId),
                profesionalId: profesionalId ? parseInt(profesionalId) : null
            },
            include: {
                cliente: true,
                profesional: true,
                horario: true
            }
        });

        return res.status(201).json({
            success: true,
            data: nuevoTurno,
            message: 'Turno reservado con éxito'
        });
    } catch (error) {
        console.error('Error al crear turno:', error);

        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'Este cliente ya tiene reservado un turno en esta fecha y horario'
            });
        }

        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al registrar el turno'
        });
    }
};

// DELETE /api/turnos/:id
// Cancelar una reserva de turno
const deleteTurno = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'ID de turno no válido'
            });
        }

        await prisma.turnoCliente.delete({
            where: { id }
        });

        return res.status(200).json({
            success: true,
            data: null,
            message: 'Turno cancelado con éxito'
        });
    } catch (error) {
        console.error('Error al cancelar turno:', error);

        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Turno no encontrado'
            });
        }

        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al cancelar el turno'
        });
    }
};

// GET /api/turnos/horarios
// Obtener la configuración de horarios/franjas horarias
const getHorarios = async (req, res) => {
    try {
        const horarios = await prisma.horarioConfig.findMany({
            orderBy: [
                { dia_semana: 'asc' },
                { hora_inicio: 'asc' }
            ]
        });

        return res.status(200).json({
            success: true,
            data: horarios,
            message: 'Horarios configurados obtenidos con éxito'
        });
    } catch (error) {
        console.error('Error al obtener horarios configurados:', error);
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al obtener la configuración de horarios'
        });
    }
};

// POST /api/turnos/horarios
// Agregar un nuevo horario/franja horaria a la configuración
const createHorario = async (req, res) => {
    try {
        const { dia_semana, hora_inicio, hora_fin } = req.body;

        if (dia_semana === undefined || !hora_inicio || !hora_fin) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'Los campos dia_semana, hora_inicio y hora_fin son obligatorios'
            });
        }

        // Crear franja horaria usando la fecha base 1970-01-01 para la parte del tiempo
        const inicioDate = new Date(`1970-01-01T${hora_inicio}:00.000Z`);
        const finDate = new Date(`1970-01-01T${hora_fin}:00.000Z`);

        const nuevoHorario = await prisma.horarioConfig.create({
            data: {
                dia_semana: parseInt(dia_semana),
                hora_inicio: inicioDate,
                hora_fin: finDate
            }
        });

        return res.status(201).json({
            success: true,
            data: nuevoHorario,
            message: 'Horario configurado con éxito'
        });
    } catch (error) {
        console.error('Error al crear configuración de horario:', error);
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al configurar el horario'
        });
    }
};

module.exports = {
    getTurnos,
    createTurno,
    deleteTurno,
    getHorarios,
    createHorario
};
