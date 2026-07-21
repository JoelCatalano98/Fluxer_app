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
                profesional: true,
                turnos: {
                    include: { cliente: true }
                } // Trae todos los turnos con los datos de sus clientes
            },
            orderBy: { hora_inicio: 'asc' }
        });

        // Obtener configuración global para cupo máximo
        const configuracion = await prisma.configuracion.findFirst();
        const maxGlobal = configuracion?.cupoGlobal || 15;

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
                categoriaId: h.categoriaId || h.categoria?.id || null,
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

        const configuracion = await prisma.configuracion.findFirst();
        const maxGlobal = configuracion?.cupoGlobal || 15;
        const bloqueo = configuracion?.bloqueoCapacidad;
        const cupo = maxGlobal;

        if (horario.turnos.length >= cupo && bloqueo) {
            return res.status(400).json({
                success: false,
                message: 'Cupo máximo alcanzado'
            });
        }

        // Validar límite de tiempo para reservar (ej: limiteCancelacionMinutos)
        const margenMinutos = configuracion?.limiteCancelacionMinutos || 60;
        // Construir la fecha/hora real de la clase forzando -03:00
        const fechaIso = new Date(d).toISOString().split('T')[0];
        const hrObj = new Date(horario.hora_inicio);
        const hh = String(hrObj.getUTCHours()).padStart(2, '0');
        const mm = String(hrObj.getUTCMinutes()).padStart(2, '0');
        
        const fechaClaseExacta = new Date(`${fechaIso}T${hh}:${mm}:00-03:00`);
        const ahora = new Date();

        // Si ya pasó la clase o falta menos del margen permitido (asumiendo que sirve para reserva)
        const minutosFaltantes = (fechaClaseExacta.getTime() - ahora.getTime()) / (1000 * 60);
        if (minutosFaltantes < 0) {
            return res.status(400).json({
                success: false,
                message: 'No puedes reservar un turno de una clase que ya pasó o está por empezar.'
            });
        }

        // Validar límite dinámico semanal
        if (configuracion?.maxReservasSemana > 0) {
            // Calcular Lunes y Domingo de la semana de la fecha solicitada
            const diaSemana = d.getDay(); // 0 = Domingo, 1 = Lunes, etc.
            const diffLunes = d.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
            
            const lunes = new Date(d);
            lunes.setDate(diffLunes);
            lunes.setUTCHours(0, 0, 0, 0);

            const domingo = new Date(lunes);
            domingo.setDate(lunes.getDate() + 6);
            domingo.setUTCHours(23, 59, 59, 999);

            const turnosSemana = await prisma.turnoCliente.count({
                where: {
                    clienteId: parseInt(clienteId),
                    fecha: {
                        gte: lunes,
                        lte: domingo
                    }
                }
            });

            if (turnosSemana >= configuracion.maxReservasSemana) {
                return res.status(400).json({
                    success: false,
                    message: "Has alcanzado tu límite máximo de clases permitidas para esta semana."
                });
            }
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

        const configuracion = await prisma.configuracion.findFirst();
        const margenMinutos = configuracion?.limiteCancelacionMinutos || 60;

        const fechaIso = new Date(turno.fecha).toISOString().split('T')[0];
        const hrObj = new Date(turno.horario.hora_inicio);
        const hh = String(hrObj.getUTCHours()).padStart(2, '0');
        const mm = String(hrObj.getUTCMinutes()).padStart(2, '0');

        const fechaClaseExacta = new Date(`${fechaIso}T${hh}:${mm}:00-03:00`);
        const ahora = new Date();

        const diferenciaMinutos = (fechaClaseExacta.getTime() - ahora.getTime()) / (1000 * 60);

        if (diferenciaMinutos < margenMinutos) {
            return res.status(400).json({
                success: false,
                message: `El tiempo límite para cancelar es de ${margenMinutos} minutos antes del inicio.`
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
