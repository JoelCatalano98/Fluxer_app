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
// Crear una nueva reserva (turno) - Soporta agendamiento masivo (múltiples días/horarios)
const createTurno = async (req, res) => {
    try {
        const {
            fecha,
            fechas,
            dias,
            dia,
            horarioId,
            horariosIds,
            clienteId,
            profesionalId
        } = req.body;

        // Validar clienteId obligatorio
        if (!clienteId) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'El campo clienteId es obligatorio'
            });
        }

        const parsedClienteId = parseInt(clienteId);
        const parsedProfesionalId = profesionalId ? parseInt(profesionalId) : null;

        // Determinar horariosIds a procesar
        let targetHorariosIds = [];
        if (Array.isArray(horariosIds)) {
            targetHorariosIds = horariosIds.map(id => parseInt(id));
        } else if (Array.isArray(horarioId)) {
            targetHorariosIds = horarioId.map(id => parseInt(id));
        } else if (horarioId) {
            targetHorariosIds = [parseInt(horarioId)];
        }

        // Determinar fechas a procesar
        let targetFechas = [];
        if (Array.isArray(fechas)) {
            targetFechas = fechas;
        } else if (Array.isArray(fecha)) {
            targetFechas = fecha;
        } else if (fecha) {
            targetFechas = [fecha];
        }

        // Si no se pasaron fechas, pero se pasaron dias/dia, calculamos las fechas correspondientes
        if (targetFechas.length === 0) {
            let targetDias = [];
            if (Array.isArray(dias)) {
                targetDias = dias;
            } else if (Array.isArray(dia)) {
                targetDias = dia;
            } else if (dias !== undefined && dias !== null) {
                targetDias = [dias];
            } else if (dia !== undefined && dia !== null) {
                targetDias = [dia];
            }

            if (targetDias.length > 0) {
                const getFechaDeDiaSemana = (diaSemanaNum) => {
                    const hoy = new Date();
                    const diaActual = hoy.getDay(); // 0 = Domingo, 1 = Lunes, etc.
                    const diff = parseInt(diaSemanaNum) - diaActual;
                    const targetDate = new Date(hoy);
                    targetDate.setDate(hoy.getDate() + diff);
                    const y = targetDate.getFullYear();
                    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
                    const d = String(targetDate.getDate()).padStart(2, '0');
                    return `${y}-${m}-${d}`;
                };

                for (const d of targetDias) {
                    let dNum = parseInt(d);
                    if (isNaN(dNum)) {
                        const mapping = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };
                        dNum = mapping[String(d).toLowerCase()] || 1;
                    }
                    targetFechas.push(getFechaDeDiaSemana(dNum));
                }
            }
        }

        // Si después de todo no hay fechas o no hay horarios, error
        if (targetFechas.length === 0 || targetHorariosIds.length === 0) {
            // Si el frontend envía horariosIds y NO tiene fechas/dias explícitos,
            // calculamos la fecha de la semana para cada horarioId según su dia_semana configurado
            if (targetHorariosIds.length > 0) {
                const configSlots = await prisma.horarioConfig.findMany({
                    where: { id: { in: targetHorariosIds } }
                });
                
                const getFechaDeDiaSemana = (diaSemanaNum) => {
                    const hoy = new Date();
                    const diaActual = hoy.getDay();
                    const diff = diaSemanaNum - diaActual;
                    const targetDate = new Date(hoy);
                    targetDate.setDate(hoy.getDate() + diff);
                    const y = targetDate.getFullYear();
                    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
                    const d = String(targetDate.getDate()).padStart(2, '0');
                    return `${y}-${m}-${d}`;
                };

                const creations = configSlots.map(h => ({
                    fecha: new Date(getFechaDeDiaSemana(h.dia_semana)),
                    horarioId: h.id,
                    clienteId: parsedClienteId,
                    profesionalId: parsedProfesionalId
                }));

                const conflicts = [];
                for (const item of creations) {
                    const existing = await prisma.turnoCliente.findFirst({
                        where: {
                            fecha: item.fecha,
                            horarioId: item.horarioId,
                            clienteId: item.clienteId
                        }
                    });
                    if (existing) {
                        conflicts.push(item);
                    }
                }

                if (conflicts.length > 0) {
                    return res.status(400).json({
                        success: false,
                        data: null,
                        message: 'Uno o más turnos ya están reservados para este cliente en las fechas y horarios seleccionados'
                    });
                }

                const results = [];
                for (const item of creations) {
                    const nuevo = await prisma.turnoCliente.create({
                        data: {
                            fecha: item.fecha,
                            horarioId: item.horarioId,
                            clienteId: item.clienteId,
                            profesionalId: item.profesionalId
                        },
                        include: {
                            cliente: true,
                            profesional: true,
                            horario: true
                        }
                    });
                    results.push(nuevo);
                }

                return res.status(201).json({
                    success: true,
                    data: results.length === 1 ? results[0] : results,
                    message: results.length === 1 ? 'Turno reservado con éxito' : 'Turnos reservados con éxito'
                });
            }

            return res.status(400).json({
                success: false,
                data: null,
                message: 'Debe especificar al menos una fecha (o día) y al menos un horario'
            });
        }

        // Si tenemos fechas y horariosIds explícitos (o calculados desde dias), creamos todas las combinaciones
        const creations = [];
        for (const f of targetFechas) {
            for (const hId of targetHorariosIds) {
                creations.push({
                    fecha: new Date(f),
                    horarioId: hId,
                    clienteId: parsedClienteId,
                    profesionalId: parsedProfesionalId
                });
            }
        }

        // Validar conflictos de existencia
        const conflicts = [];
        for (const item of creations) {
            const existing = await prisma.turnoCliente.findFirst({
                where: {
                    fecha: item.fecha,
                    horarioId: item.horarioId,
                    clienteId: item.clienteId
                }
            });
            if (existing) {
                conflicts.push(item);
            }
        }

        if (conflicts.length > 0) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'Uno o más turnos ya están reservados para este cliente en las fechas y horarios seleccionados'
            });
        }

        // Realizar inserciones
        const results = [];
        for (const item of creations) {
            const nuevo = await prisma.turnoCliente.create({
                data: {
                    fecha: item.fecha,
                    horarioId: item.horarioId,
                    clienteId: item.clienteId,
                    profesionalId: item.profesionalId
                },
                include: {
                    cliente: true,
                    profesional: true,
                    horario: true
                }
            });
            results.push(nuevo);
        }

        return res.status(201).json({
            success: true,
            data: results.length === 1 ? results[0] : results,
            message: results.length === 1 ? 'Turno reservado con éxito' : 'Turnos reservados con éxito'
        });
    } catch (error) {
        console.error('Error al crear turno(s):', error);
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
            message: 'Error interno del servidor al registrar el turno o los turnos'
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
// Obtener la configuración de horarios/franjas horarias ACTIVAS
const getHorarios = async (req, res) => {
    try {
        const horarios = await prisma.horarioConfig.findMany({
            where: {
                activo: true
            },
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
// Agregar nuevo(s) horario(s)/franja(s) horaria(s) a la configuración. Soporta múltiples días.
const createHorario = async (req, res) => {
    try {
        const { dia_semana, dias, hora_inicio, hora_fin } = req.body;

        if (!hora_inicio || !hora_fin) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'Los campos hora_inicio y hora_fin son obligatorios'
            });
        }

        let targetDias = [];
        if (Array.isArray(dias)) {
            targetDias = dias;
        } else if (dia_semana !== undefined && dia_semana !== null) {
            if (Array.isArray(dia_semana)) {
                targetDias = dia_semana;
            } else {
                targetDias = [dia_semana];
            }
        }

        if (targetDias.length === 0) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'Debe especificar al menos un día (dia_semana o dias)'
            });
        }

        const inicioDate = new Date(`1970-01-01T${hora_inicio}:00.000Z`);
        const finDate = new Date(`1970-01-01T${hora_fin}:00.000Z`);

        const createdHorarios = [];
        for (const dia of targetDias) {
            const nuevoHorario = await prisma.horarioConfig.create({
                data: {
                    dia_semana: parseInt(dia),
                    hora_inicio: inicioDate,
                    hora_fin: finDate,
                    activo: true
                }
            });
            createdHorarios.push(nuevoHorario);
        }

        return res.status(201).json({
            success: true,
            data: createdHorarios.length === 1 ? createdHorarios[0] : createdHorarios,
            message: createdHorarios.length === 1 ? 'Horario configurado con éxito' : 'Horarios configurados con éxito'
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

// PUT /api/turnos/horarios/:id
// Editar una franja horaria existente
const updateHorario = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'ID de horario no válido'
            });
        }

        const { dia_semana, hora_inicio, hora_fin } = req.body;

        const dataToUpdate = {};
        if (dia_semana !== undefined && dia_semana !== null) {
            dataToUpdate.dia_semana = parseInt(dia_semana);
        }
        if (hora_inicio) {
            dataToUpdate.hora_inicio = new Date(`1970-01-01T${hora_inicio}:00.000Z`);
        }
        if (hora_fin) {
            dataToUpdate.hora_fin = new Date(`1970-01-01T${hora_fin}:00.000Z`);
        }

        const horarioActualizado = await prisma.horarioConfig.update({
            where: { id },
            data: dataToUpdate
        });

        return res.status(200).json({
            success: true,
            data: horarioActualizado,
            message: 'Horario actualizado con éxito'
        });
    } catch (error) {
        console.error('Error al actualizar horario:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Horario no encontrado'
            });
        }
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al actualizar el horario'
        });
    }
};

// DELETE /api/turnos/horarios/:id
// Dar de baja un horario (baja lógica para proteger datos históricos)
const deleteHorario = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'ID de horario no válido'
            });
        }

        // Baja lógica: actualizamos el campo activo a false
        await prisma.horarioConfig.update({
            where: { id },
            data: { activo: false }
        });

        return res.status(200).json({
            success: true,
            data: null,
            message: 'Horario dado de baja con éxito'
        });
    } catch (error) {
        console.error('Error al dar de baja el horario:', error);

        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Horario no encontrado'
            });
        }

        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al dar de baja el horario'
        });
    }
};

module.exports = {
    getTurnos,
    createTurno,
    deleteTurno,
    getHorarios,
    createHorario,
    updateHorario,
    deleteHorario
};
