const prisma = require('../config/prisma');

// Obtener horarios disponibles para el socio
const getClasesDisponibles = async (req, res) => {
    try {
        const { dia_semana } = req.query; // Para filtrar por el día seleccionado en el carrusel (1 a 6)

        const where = { activo: true };
        if (dia_semana) {
            where.dia_semana = parseInt(dia_semana);
        }

        const horarios = await prisma.horarioConfig.findMany({
            where,
            include: { 
                categoria: true,
                turnos: {
                    include: { cliente: true }
                } // Trae todos los turnos con los datos de sus clientes
            },
            orderBy: { hora_inicio: 'asc' }
        });

        // Obtener configuración global para cupo máximo
        const configuracion = await prisma.configuracionLocal.findFirst();
        const maxGlobal = configuracion?.capacidad_max_hora || 15;

        // Formatear para facilitar uso en el front
        const horariosFormateados = horarios.map(h => {
            const fechaActual = new Date();
            // Lógica simplificada: filtraremos los turnos de la UI o devolvemos un total.
            // Para Crossfy style devolvemos un count directo.
            return {
                id: h.id,
                dia_semana: h.dia_semana,
                hora_inicio: h.hora_inicio,
                hora_fin: h.hora_fin,
                categoria: h.categoria,
                cupoMaximo: maxGlobal,
                turnos: h.turnos
            };
        });
        
        return res.status(200).json({
            success: true,
            data: horariosFormateados
        });
    } catch (error) {
        console.error('Error al obtener horarios disponibles:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener clases'
        });
    }
};

// Reservar un turno
const reservarTurno = async (req, res) => {
    try {
        const { horarioId, clienteId, fechaExacta } = req.body;

        if (!horarioId || !clienteId || !fechaExacta) {
            return res.status(400).json({
                success: false,
                message: 'horarioId, clienteId y fechaExacta son obligatorios'
            });
        }

        // Parsear fecha YYYY-MM-DD o ISO a YYYY-MM-DDT00:00:00.000Z
        const d = new Date(fechaExacta);
        d.setUTCHours(0,0,0,0);

        const horario = await prisma.horarioConfig.findUnique({
            where: { id: parseInt(horarioId) },
            include: { 
                turnos: {
                    where: { fecha: d }
                } 
            }
        });

        if (!horario) {
            return res.status(404).json({
                success: false,
                message: 'El horario solicitado no existe'
            });
        }

        const configuracion = await prisma.configuracionLocal.findFirst();
        const maxGlobal = configuracion?.capacidad_max_hora || 15;
        const cupo = maxGlobal;

        if (horario.turnos.length >= cupo) {
            return res.status(400).json({
                success: false,
                message: 'La clase ya está llena para este horario y fecha'
            });
        }

        // Validar límite de tiempo para reservar (ej: configuracion.margen_cancelacion_horas)
        const margenHoras = configuracion?.margen_cancelacion_horas || 1;
        const ahora = new Date();
        
        // Construir la fecha/hora real de la clase
        const horaInicio = new Date(horario.hora_inicio);
        const inicioClase = new Date(d);
        inicioClase.setUTCHours(horaInicio.getUTCHours(), horaInicio.getUTCMinutes(), 0, 0);

        // Si ya pasó la clase o falta menos del margen permitido (asumiendo que sirve para reserva)
        const horasFaltantes = (inicioClase - ahora) / (1000 * 60 * 60);
        if (horasFaltantes < 0) {
            return res.status(400).json({
                success: false,
                message: 'No puedes reservar un turno de una clase que ya pasó o está por empezar.'
            });
        }

        // Valida que el cliente no supere el máximo de reservas permitidas por día (ej. 1 al día)
        const turnosDelClienteHoy = await prisma.turnoCliente.count({
            where: {
                clienteId: parseInt(clienteId),
                fecha: d
            }
        });

        // Limite arbitrario: 2 turnos por día si no existe en la config
        if (turnosDelClienteHoy >= 2) {
            return res.status(400).json({
                success: false,
                message: 'Alcanzaste el límite de reservas por día (máx. 2).'
            });
        }

        // Verificar si el usuario ya está anotado
        const yaAnotado = horario.turnos.find(t => t.clienteId === parseInt(clienteId));
        if (yaAnotado) {
            return res.status(400).json({
                success: false,
                message: 'Ya estás anotado en esta clase'
            });
        }

        // Crear reserva TurnoCliente
        const nuevoTurno = await prisma.turnoCliente.create({
            data: {
                horarioId: parseInt(horarioId),
                clienteId: parseInt(clienteId),
                fecha: d
            }
        });

        return res.status(201).json({
            success: true,
            data: nuevoTurno,
            message: '¡Turno reservado con éxito!'
        });
    } catch (error) {
        console.error('Error al reservar turno:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al procesar la reserva'
        });
    }
};

// Cancelar un turno
const cancelarTurno = async (req, res) => {
    try {
        const { id } = req.params;
        const turnoId = parseInt(id);

        if (isNaN(turnoId)) {
            return res.status(400).json({ success: false, message: 'ID de turno inválido' });
        }

        const turno = await prisma.turnoCliente.findUnique({
            where: { id: turnoId },
            include: { horario: true }
        });

        if (!turno) {
            return res.status(404).json({ success: false, message: 'Turno no encontrado' });
        }

        const configuracion = await prisma.configuracionLocal.findFirst();
        const margenHoras = configuracion?.margen_cancelacion_horas || 1;

        const ahora = new Date();
        const horaInicio = new Date(turno.horario.hora_inicio);
        const inicioClase = new Date(turno.fecha);
        inicioClase.setUTCHours(horaInicio.getUTCHours(), horaInicio.getUTCMinutes(), 0, 0);

        const horasFaltantes = (inicioClase - ahora) / (1000 * 60 * 60);

        if (horasFaltantes < margenHoras) {
            return res.status(400).json({
                success: false,
                message: `El tiempo límite para cancelar es de ${margenHoras} hora(s) antes del inicio.`
            });
        }

        await prisma.turnoCliente.delete({
            where: { id: turnoId }
        });

        return res.status(200).json({
            success: true,
            message: 'Reserva cancelada con éxito'
        });
    } catch (error) {
        console.error('Error al cancelar turno:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al cancelar la reserva'
        });
    }
};

module.exports = {
    getClasesDisponibles,
    reservarTurno,
    cancelarTurno
};
