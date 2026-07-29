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
            include: { categoria: true, profesional: true },
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
        const { hora_inicio, hora_fin, diasConfig } = req.body;

        if (!hora_inicio || !hora_fin || !diasConfig || !Array.isArray(diasConfig) || diasConfig.length === 0) {
            return res.status(400).json({
                success: false, data: null,
                message: 'Los campos hora_inicio, hora_fin y diasConfig son obligatorios'
            });
        }

        const inicioDate = parseTimeStr(hora_inicio);
        const finDate = parseTimeStr(hora_fin);
        const inicioStr = formatTime(inicioDate);
        const finStr = formatTime(finDate);

        const createdHorarios = [];
        for (const config of diasConfig) {
            const diaInt = parseInt(config.dia_semana);
            const catIdParsed = config.categoriaId ? parseInt(config.categoriaId) : null;
            const profIdParsed = config.profesionalId ? parseInt(config.profesionalId) : null;

            // Buscar si ya existe uno (activo o inactivo) para ese día y hora
            const allForDay = await prisma.horarioConfig.findMany({
                where: { dia_semana: diaInt }
            });
            const existing = allForDay.find(h =>
                formatTime(h.hora_inicio) === inicioStr && 
                formatTime(h.hora_fin) === finStr &&
                h.categoriaId === catIdParsed &&
                h.profesionalId === profIdParsed
            );

            if (existing) {
                // Reactivar si estaba inactivo, o actualizar si ya activo
                const reactivado = await prisma.horarioConfig.update({
                    where: { id: existing.id },
                    data: { 
                        activo: true, 
                        categoriaId: catIdParsed,
                        profesionalId: profIdParsed
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
                        categoriaId: catIdParsed,
                        profesionalId: profIdParsed
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
    const { id } = req.params;
    const { hora_inicio, hora_fin, diasConfig } = req.body;

    if (!diasConfig || !Array.isArray(diasConfig)) {
      return res.status(400).json({ message: "El array diasConfig es requerido." });
    }

    const horaInicioDate = new Date(`1970-01-01T${hora_inicio}:00Z`);
    const horaFinDate = new Date(`1970-01-01T${hora_fin}:00Z`);

    const idParsed = parseInt(id);
    const horarioBase = await prisma.horarioConfig.findUnique({
      where: { id: idParsed }
    });

    if (!horarioBase) {
      return res.status(404).json({ message: "Horario base no encontrado." });
    }

    const baseInicioStr = formatTime(horarioBase.hora_inicio);
    const baseFinStr = formatTime(horarioBase.hora_fin);

    // Buscar TODOS los registros activos actuales de esta franja transversal
    const registrosActuales = await prisma.horarioConfig.findMany({
      where: { activo: true }
    });
    
    const afectados = registrosActuales.filter(h => 
      formatTime(h.hora_inicio) === baseInicioStr && formatTime(h.hora_fin) === baseFinStr
    );

    const idsProcesados = [];

    // Iterar sobre la configuración de los días que el usuario seleccionó
    for (const config of diasConfig) {
      const diaParsed = parseInt(config.dia_semana);
      const catIdParsed = config.categoriaId ? parseInt(config.categoriaId) : null;
      const profIdParsed = config.profesionalId !== undefined ? (config.profesionalId ? parseInt(config.profesionalId) : null) : null;
      
      const existente = afectados.find(r => r.dia_semana === diaParsed);

      if (existente) {
        idsProcesados.push(existente.id);
        
        // Ver si cambió la disciplina o la hora
        const cambioCategoria = existente.categoriaId !== catIdParsed;
        const cambioHora = formatTime(existente.hora_inicio) !== formatTime(horaInicioDate) || 
                           formatTime(existente.hora_fin) !== formatTime(horaFinDate);

        if (cambioCategoria || cambioHora) {
          // Hard-rule: Soft-delete del viejo y crear uno nuevo para no alterar el historial de turnos
          await prisma.horarioConfig.update({
            where: { id: existente.id },
            data: { activo: false }
          });
          
          await prisma.horarioConfig.create({
            data: {
              dia_semana: diaParsed,
              hora_inicio: horaInicioDate,
              hora_fin: horaFinDate,
              activo: true,
              categoriaId: catIdParsed,
              profesionalId: profIdParsed
            }
          });
        } else {
          // Solo cambió el profesional (o nada), podemos actualizar in-place
          await prisma.horarioConfig.update({
            where: { id: existente.id },
            data: {
              profesionalId: profIdParsed
            }
          });
        }
      } else {
        // Es un día nuevo que se acaba de configurar
        await prisma.horarioConfig.create({
          data: {
            dia_semana: diaParsed,
            hora_inicio: horaInicioDate,
            hora_fin: horaFinDate,
            activo: true,
            categoriaId: catIdParsed,
            profesionalId: profIdParsed
          }
        });
      }
    }

    // Los registros actuales de esta franja que NO vinieron en diasConfig se desactivan
    for (const reg of afectados) {
      if (!idsProcesados.includes(reg.id)) {
        await prisma.horarioConfig.update({
          where: { id: reg.id },
          data: { activo: false }
        });
      }
    }

    res.json({ success: true, message: "Horarios actualizados de forma inteligente" });

  } catch (error) {
    console.error("Error en updateHorario:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
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
