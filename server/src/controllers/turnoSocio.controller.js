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

        // Obtener configuración global para cupo máximo si la categoría/horario no tiene uno
        const configuracion = await prisma.configuracion.findFirst();
        const maxGlobal = configuracion?.capacidadMaxima || 15;

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
                cupoMaximo: maxGlobal, // Podría venir de h.categoria.cupo si existiera
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

        const configuracion = await prisma.configuracion.findFirst();
        const maxGlobal = configuracion?.capacidadMaxima || 15;

        if (horario.turnos.length >= maxGlobal) {
            return res.status(400).json({
                success: false,
                message: 'La clase ya está llena para este horario y fecha'
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

module.exports = {
    getClasesDisponibles,
    reservarTurno
};
