const prisma = require('../config/prisma');

// Auxiliar: formatea un valor de hora (Date o string ISO) a "HH:MM" en UTC
const formatTime = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Auxiliar: parsea un string "HH:MM" a un Date UTC válido para columnas TIME
const parseTimeStr = (timeStr) => {
    const match = timeStr.match(/^(\d{2}):(\d{2})/);
    if (match) {
        return new Date(`1970-01-01T${match[1]}:${match[2]}:00.000Z`);
    }
    return new Date(`1970-01-01T${timeStr}:00.000Z`);
};

// GET /api/turnos
const getTurnos = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        const where = {};
        if (fechaInicio && fechaFin) {
            where.fecha = {
                gte: new Date(fechaInicio + 'T00:00:00.000Z'),
                lte: new Date(fechaFin + 'T23:59:59.999Z')
            };
        } else {
            const hoy = new Date();
            const diaSemana = hoy.getDay();
            const lunes = new Date(hoy);
            lunes.setDate(hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1));
            lunes.setHours(0, 0, 0, 0);

            const sabado = new Date(lunes);
            sabado.setDate(lunes.getDate() + 5);
            sabado.setHours(23, 59, 59, 999);

            where.fecha = {
                gte: new Date(lunes.toISOString().split('T')[0] + 'T00:00:00.000Z'),
                lte: new Date(sabado.toISOString().split('T')[0] + 'T23:59:59.999Z')
            };
        }

        const turnos = await prisma.turnoCliente.findMany({
            where,
            include: {
                cliente: true,
                profesional: true,
                horario: true
            },
            orderBy: { id: 'desc' }
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
// Soporta:
//   a) Modo explícito (nuevo): { turnos: [{ fecha, horarioId }], clienteId, profesionalId }
//   b) Modo legacy (simple):   { fecha, horarioId, clienteId, profesionalId }
const createTurno = async (req, res) => {
    try {
        const { turnos, fecha, horarioId, clienteId, profesionalId } = req.body;

        if (!clienteId) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'El campo clienteId es obligatorio'
            });
        }

        const parsedClienteId = parseInt(clienteId);
        const parsedProfesionalId = profesionalId ? parseInt(profesionalId) : null;

        // Construir la lista limpia de inserciones
        const creations = [];

        if (Array.isArray(turnos) && turnos.length > 0) {
            // MODO EXPLÍCITO: cada item trae { fecha: "YYYY-MM-DD", horarioId: N }
            for (const t of turnos) {
                if (!t.fecha || !t.horarioId) continue;
                const fechaStr = String(t.fecha).split('T')[0]; // limpiar a YYYY-MM-DD
                creations.push({
                    fecha: new Date(fechaStr + 'T00:00:00.000Z'),
                    horarioId: parseInt(t.horarioId),
                    clienteId: parsedClienteId,
                    profesionalId: parsedProfesionalId
                });
            }
        } else if (fecha && horarioId) {
            // MODO LEGACY: un solo turno
            const fechaStr = String(fecha).split('T')[0];
            creations.push({
                fecha: new Date(fechaStr + 'T00:00:00.000Z'),
                horarioId: parseInt(horarioId),
                clienteId: parsedClienteId,
                profesionalId: parsedProfesionalId
            });
        }

        if (creations.length === 0) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'Debe especificar al menos un turno con fecha y horarioId'
            });
        }

        // Validar conflictos y feriados
        for (const item of creations) {
            const fechaStr = item.fecha.toISOString().split('T')[0];
            const feriados = await prisma.feriado.findMany({
                where: {
                    fechaInicio: { lte: fechaStr },
                    fechaFin: { gte: fechaStr }
                }
            });
            if (feriados.length > 0) {
                return res.status(400).json({
                    success: false,
                    data: null,
                    message: `Día bloqueado por feriado: ${feriados[0].motivo}`
                });
            }

            const existing = await prisma.turnoCliente.findFirst({
                where: {
                    fecha: item.fecha,
                    horarioId: item.horarioId,
                    clienteId: item.clienteId
                }
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    data: null,
                    message: `El cliente ya tiene un turno reservado el ${fechaStr} en el horario seleccionado`
                });
            }
        }

        // Validar capacidad máxima si bloquearCapacidad está activo
        const config = await prisma.configuracion.findUnique({ where: { id: 1 } });
        if (config && config.bloquearCapacidad) {
            const limite = config.capacidadMaxima;
            for (const item of creations) {
                const count = await prisma.turnoCliente.count({
                    where: {
                        fecha: item.fecha,
                        horarioId: item.horarioId
                    }
                });

                if (count >= limite) {
                    return res.status(400).json({
                        success: false,
                        data: null,
                        message: `Capacidad Máxima Alcanzada (Límite: ${limite} personas)`
                    });
                }
            }
        }

        // Insertar en MySQL
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
            message: results.length === 1 ? 'Turno reservado con éxito' : `${results.length} turnos reservados con éxito`
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
            message: 'Error interno del servidor al registrar el turno'
        });
    }
};

// DELETE /api/turnos/:id
const deleteTurno = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, data: null, message: 'ID de turno no válido' });
        }

        await prisma.turnoCliente.delete({ where: { id } });

        return res.status(200).json({ success: true, data: null, message: 'Turno cancelado con éxito' });
    } catch (error) {
        console.error('Error al cancelar turno:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, data: null, message: 'Turno no encontrado' });
        }
        return res.status(500).json({ success: false, data: null, message: 'Error interno del servidor al cancelar el turno' });
    }
};

// GET /api/turnos/horarios
const getHorarios = async (req, res) => {
    try {
        const horarios = await prisma.horarioConfig.findMany({
            where: { activo: true },
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
const createHorario = async (req, res) => {
    try {
        const { dia_semana, dias, hora_inicio, hora_fin, categoriaId } = req.body;

        if (!hora_inicio || !hora_fin) {
            return res.status(400).json({
                success: false, data: null,
                message: 'Los campos hora_inicio y hora_fin son obligatorios'
            });
        }

        let targetDias = [];
        if (Array.isArray(dias)) {
            targetDias = dias;
        } else if (dia_semana !== undefined && dia_semana !== null) {
            targetDias = Array.isArray(dia_semana) ? dia_semana : [dia_semana];
        }

        if (targetDias.length === 0) {
            return res.status(400).json({
                success: false, data: null,
                message: 'Debe especificar al menos un día (dia_semana o dias)'
            });
        }

        const inicioDate = parseTimeStr(hora_inicio);
        const finDate = parseTimeStr(hora_fin);
        const inicioStr = formatTime(inicioDate);
        const finStr = formatTime(finDate);

        const createdHorarios = [];
        for (const dia of targetDias) {
            const diaInt = parseInt(dia);

            // Buscar si ya existe uno (activo o inactivo) para ese día y hora
            const allForDay = await prisma.horarioConfig.findMany({
                where: { dia_semana: diaInt }
            });
            const existing = allForDay.find(h =>
                formatTime(h.hora_inicio) === inicioStr && formatTime(h.hora_fin) === finStr
            );

            if (existing) {
                // Reactivar si estaba inactivo, o actualizar si ya activo
                const reactivado = await prisma.horarioConfig.update({
                    where: { id: existing.id },
                    data: { 
                        activo: true, 
                        categoriaId: categoriaId ? parseInt(categoriaId) : null 
                    }
                });
                createdHorarios.push(reactivado);
            } else {
                const nuevoHorario = await prisma.horarioConfig.create({
                    data: {
                        dia_semana: diaInt,
                        hora_inicio: inicioDate,
                        hora_fin: finDate,
                        activo: true,
                        categoriaId: categoriaId ? parseInt(categoriaId) : null
                    }
                });
                createdHorarios.push(nuevoHorario);
            }
        }

        return res.status(201).json({
            success: true,
            data: createdHorarios.length === 1 ? createdHorarios[0] : createdHorarios,
            message: createdHorarios.length === 1 ? 'Horario configurado con éxito' : 'Horarios configurados con éxito'
        });
    } catch (error) {
        console.error('Error al crear configuración de horario:', error);
        return res.status(500).json({
            success: false, data: null,
            message: 'Error interno del servidor al configurar el horario'
        });
    }
};

// PUT /api/turnos/horarios/:id
// Editar una franja horaria: soporta replicación/desactivación multidía mediante array "dias"
const updateHorario = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, data: null, message: 'ID de horario no válido' });
        }

        const { dias, dia_semana, hora_inicio, hora_fin, categoriaId } = req.body;

        const horarioBase = await prisma.horarioConfig.findUnique({ where: { id } });
        if (!horarioBase) {
            return res.status(404).json({ success: false, data: null, message: 'Horario base no encontrado' });
        }

        // MODO CLÁSICO (sin array de días): edición simple de un solo registro
        if (!dias || !Array.isArray(dias)) {
            const dataToUpdate = {};
            if (dia_semana !== undefined && dia_semana !== null) {
                dataToUpdate.dia_semana = parseInt(dia_semana);
            }
            if (hora_inicio) dataToUpdate.hora_inicio = parseTimeStr(hora_inicio);
            if (hora_fin) dataToUpdate.hora_fin = parseTimeStr(hora_fin);
            if (categoriaId !== undefined) dataToUpdate.categoriaId = categoriaId ? parseInt(categoriaId) : null;

            const horarioActualizado = await prisma.horarioConfig.update({
                where: { id },
                data: dataToUpdate
            });
            return res.status(200).json({ success: true, data: horarioActualizado, message: 'Horario actualizado con éxito' });
        }

        // MODO MULTIDÍA: sincronizar la familia de franjas hermanas del mismo rango horario
        const baseInicioStr = formatTime(horarioBase.hora_inicio);
        const baseFinStr = formatTime(horarioBase.hora_fin);

        // Buscar TODOS los registros de la tabla (activos e inactivos) para poder reutilizar registros
        const allHorarios = await prisma.horarioConfig.findMany();

        // Hermanos activos = mismo rango horario y categoria que el base (comparación en memoria, ambos del DB)
        const hermanosActivos = allHorarios.filter(h =>
            h.activo === true &&
            formatTime(h.hora_inicio) === baseInicioStr &&
            formatTime(h.hora_fin) === baseFinStr &&
            h.categoriaId === horarioBase.categoriaId
        );

        const hermanosPorDia = {};
        hermanosActivos.forEach(h => { hermanosPorDia[h.dia_semana] = h; });

        const targetInicio = parseTimeStr(hora_inicio);
        const targetFin = parseTimeStr(hora_fin);
        const targetInicioStr = formatTime(targetInicio);
        const targetFinStr = formatTime(targetFin);
        const diasMarcados = dias.map(d => parseInt(d));

        const results = [];

        for (let dia = 1; dia <= 6; dia++) {
            const estaMarcado = diasMarcados.includes(dia);
            const hermanoExistente = hermanosPorDia[dia];

            if (estaMarcado) {
                if (hermanoExistente) {
                    // Existe activo para este día → actualizar sus horas y categoria
                    const actualizado = await prisma.horarioConfig.update({
                        where: { id: hermanoExistente.id },
                        data: { 
                            hora_inicio: targetInicio, 
                            hora_fin: targetFin,
                            categoriaId: categoriaId ? parseInt(categoriaId) : null 
                        }
                    });
                    results.push(actualizado);
                } else {
                    // No existe hermano activo → buscar si hay un registro inactivo para este día con las NUEVAS horas
                    const inactivoConNuevaHora = allHorarios.find(h =>
                        h.dia_semana === dia &&
                        h.activo === false &&
                        formatTime(h.hora_inicio) === targetInicioStr &&
                        formatTime(h.hora_fin) === targetFinStr
                    );

                    // También buscar inactivo con las VIEJAS horas (por si se reactivó la misma franja)
                    const inactivoConViejaHora = !inactivoConNuevaHora
                        ? allHorarios.find(h =>
                            h.dia_semana === dia &&
                            h.activo === false &&
                            formatTime(h.hora_inicio) === baseInicioStr &&
                            formatTime(h.hora_fin) === baseFinStr
                        )
                        : null;

                    const inactivo = inactivoConNuevaHora || inactivoConViejaHora;

                    if (inactivo) {
                        const reactivado = await prisma.horarioConfig.update({
                            where: { id: inactivo.id },
                            data: { 
                                hora_inicio: targetInicio, 
                                hora_fin: targetFin, 
                                activo: true,
                                categoriaId: categoriaId ? parseInt(categoriaId) : null
                            }
                        });
                        results.push(reactivado);
                    } else {
                        // No existe ningún registro reutilizable → crear nuevo
                        const nuevo = await prisma.horarioConfig.create({
                            data: {
                                dia_semana: dia,
                                hora_inicio: targetInicio,
                                hora_fin: targetFin,
                                activo: true,
                                categoriaId: categoriaId ? parseInt(categoriaId) : null
                            }
                        });
                        results.push(nuevo);
                    }
                }
            } else {
                // Día NO marcado → si tenía hermano activo, desactivar
                if (hermanoExistente) {
                    await prisma.horarioConfig.update({
                        where: { id: hermanoExistente.id },
                        data: { activo: false }
                    });
                }
            }
        }

        return res.status(200).json({
            success: true,
            data: results.length > 0 ? results[0] : null,
            message: 'Franja horaria actualizada con éxito para los días seleccionados'
        });
    } catch (error) {
        console.error('Error al actualizar horario:', error);
        return res.status(500).json({
            success: false, data: null,
            message: 'Error interno del servidor al actualizar el horario'
        });
    }
};

// DELETE /api/turnos/horarios/:id
const deleteHorario = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, data: null, message: 'ID de horario no válido' });
        }

        const horario = await prisma.horarioConfig.findUnique({ where: { id } });
        if (!horario) {
            return res.status(404).json({ success: false, data: null, message: 'Horario no encontrado' });
        }

        // Baja lógica de todos los hermanos activos con el mismo rango (comparación en memoria)
        const baseInicioStr = formatTime(horario.hora_inicio);
        const baseFinStr = formatTime(horario.hora_fin);

        const allActive = await prisma.horarioConfig.findMany({ where: { activo: true } });
        const siblingIds = allActive
            .filter(h => formatTime(h.hora_inicio) === baseInicioStr && formatTime(h.hora_fin) === baseFinStr)
            .map(h => h.id);

        if (siblingIds.length > 0) {
            await prisma.horarioConfig.updateMany({
                where: { id: { in: siblingIds } },
                data: { activo: false }
            });
        }

        return res.status(200).json({ success: true, data: null, message: 'Franja horaria dada de baja con éxito' });
    } catch (error) {
        console.error('Error al dar de baja el horario:', error);
        return res.status(500).json({ success: false, data: null, message: 'Error interno del servidor al dar de baja el horario' });
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
