const prisma = require('../config/prisma');
const { obtenerRangoSemanal } = require('../utils/rangoSemanal');

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
            const { startOfRange, endOfRange } = await obtenerRangoSemanal();
            where.fecha = {
                gte: startOfRange,
                lte: endOfRange
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
    const { clienteId, profesionalId, turnos, horarioId, fecha } = req.body;

    if (!clienteId) {
      return res.status(400).json({ success: false, message: "El cliente es obligatorio." });
    }

    const clienteParsed = parseInt(clienteId);
    const profParsed = profesionalId ? parseInt(profesionalId) : null;

    let itemsToCreate = [];

    // Soportar tanto formato de array de turnos [{fecha, horarioId}] como formato individual
    if (turnos && Array.isArray(turnos) && turnos.length > 0) {
      itemsToCreate = turnos.map(t => ({
        clienteId: clienteParsed,
        profesionalId: profParsed,
        horarioId: parseInt(t.horarioId),
        fecha: new Date(t.fecha).toISOString().split('T')[0]
      }));
    } else if (horarioId && fecha) {
      itemsToCreate = [{
        clienteId: clienteParsed,
        profesionalId: profParsed,
        horarioId: parseInt(horarioId),
        fecha: new Date(fecha).toISOString().split('T')[0]
      }];
    } else {
      return res.status(400).json({ success: false, message: "Datos de turnos incompletos." });
    }

    // Inserción masiva o múltiple segura
    const createdTurnos = [];
    for (const item of itemsToCreate) {
      // Prisma requiere objeto Date para campos DateTime, aseguramos el formato UTC correcto a medianoche
      const fechaObj = new Date(item.fecha + 'T00:00:00.000Z');
      
      // Verificar si ya existe para evitar duplicar exactamente el mismo turno al mismo cliente
      const existente = await prisma.turnoCliente.findFirst({
        where: {
          clienteId: item.clienteId,
          horarioId: item.horarioId,
          fecha: fechaObj
        }
      });

      if (!existente) {
        const nuevo = await prisma.turnoCliente.create({
          data: {
            clienteId: item.clienteId,
            profesionalId: item.profesionalId,
            horarioId: item.horarioId,
            fecha: fechaObj
          },
          include: {
            cliente: true,
            profesional: true,
            horario: true
          }
        });
        createdTurnos.push(nuevo);
      }
    }

    res.json({
      success: true,
      message: "¡Turno(s) registrado(s) con éxito!",
      data: createdTurnos.length === 1 ? createdTurnos[0] : createdTurnos
    });

  } catch (error) {
    console.error("Error en createTurno:", error);
    res.status(500).json({ success: false, message: "Error interno al crear el turno", error: error.message });
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
