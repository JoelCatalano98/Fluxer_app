const prisma = require('../config/prisma');
const { asegurarCargosAlDia, calcularCicloActual } = require('../services/cargos.service');
const { getOcultarInscriptosEnabled } = require('../config/ocultarInscriptosCache');

// Helper para calcular Lunes 00:00:00 UTC y Domingo 23:59:59 UTC de la semana de cualquier fecha
// sin sufrir distorsiones por zona horaria local del servidor
function calcularRangoSemanaUTC(fechaStr) {
    const isoStr = typeof fechaStr === 'string' ? fechaStr.split('T')[0] : new Date(fechaStr).toISOString().split('T')[0];
    const [y, m, d] = isoStr.split('-').map(Number);
    const targetUTC = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    const dayOfWeek = targetUTC.getUTCDay(); // 0 = Dom, 1 = Lun, ..., 6 = Sab
    const diffToMonday = dayOfWeek === 0 ? -6 : (1 - dayOfWeek);
    
    const lunes = new Date(targetUTC);
    lunes.setUTCDate(targetUTC.getUTCDate() + diffToMonday);
    lunes.setUTCHours(0, 0, 0, 0);
    
    const domingo = new Date(lunes);
    domingo.setUTCDate(lunes.getUTCDate() + 6);
    domingo.setUTCHours(23, 59, 59, 999);
    
    return { lunes, domingo };
}

// Helper para extraer YYYY, MM, DD en timezone America/Argentina/Buenos_Aires
// Si recibe 'YYYY-MM-DD' (con o sin T00:00:00.000Z), toma los componentes directos de la fecha nominal;
// si recibe un Date o timestamp con hora distinta, usa Intl en America/Argentina/Buenos_Aires.
function extraerFechaNominalArgentina(fechaInput) {
    if (typeof fechaInput === 'string') {
        const match = fechaInput.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T00:00:00(?:\.000)?Z$)/);
        if (match) {
            return {
                year: Number(match[1]),
                month: Number(match[2]),
                day: Number(match[3]),
                isoDate: `${match[1]}-${match[2]}-${match[3]}`
            };
        }
    }
    const d = fechaInput instanceof Date ? fechaInput : new Date(fechaInput);
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const parts = formatter.formatToParts(d);
    const year = Number(parts.find(p => p.type === 'year').value);
    const month = Number(parts.find(p => p.type === 'month').value);
    const day = Number(parts.find(p => p.type === 'day').value);
    const isoDate = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { year, month, day, isoDate };
}

// Helper para calcular el rango del MES CALENDARIO (día 1 al último día del mes) en UTC
// para columnas @db.Date, sin sufrir el desfasaje UTC-3 de setHours(0,0,0,0).
function calcularRangoMesCalendarioUTC(fechaInput) {
    const { year, month } = extraerFechaNominalArgentina(fechaInput);
    const inicioMes = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const finMes = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return { inicioMes, finMes, year, month };
}

// Cuenta cuántas veces caen los días de la semana indicados (0=Dom..6=Sab) en un mes calendario (year, month 1..12)
function contarOcurrenciasDiaSemanaEnMes(year, month, diasSemana) {
    if (!Array.isArray(diasSemana) || diasSemana.length === 0) return 0;
    const diasSet = new Set(diasSemana.map(Number));
    const totalDiasMes = new Date(Date.UTC(year, month, 0)).getUTCDate();
    let totalOcurrencias = 0;

    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const dow = new Date(Date.UTC(year, month - 1, dia)).getUTCDay();
        if (diasSet.has(dow)) {
            totalOcurrencias++;
        }
    }
    return totalOcurrencias;
}

/**
 * Infiere los N días habituales del socio en el mes (N = cantidadClasesPlan) a partir de los turnos
 * que tiene en ese mes (ACTIVO o CANCELADO_PENALIZADO) y calcula el cupo mensual real (8, 9 o 10).
 *
 * NOTA / LIMITACIÓN CONOCIDA ACEPTADA:
 * Como la cancelación en término realiza un DELETE físico en `turnos_clientes`, los días habituales
 * se infieren por mayoría de frecuencia entre los turnos existentes del mes. Si un socio cancela
 * la mayoría de las ocurrencias de uno de sus días fijos y las recupera todas en un mismo tercer día
 * (ej. cancela 3 miércoles y recupera 3 viernes en un mes de 4 miércoles), el día de recupero puede
 * igualar o superar en frecuencia al día original.
 */
function inferirDiasHabitualesYCupoMensual(turnosMes, cantidadClasesPlan, year, month) {
    const n = parseInt(cantidadClasesPlan);
    if (!Array.isArray(turnosMes) || turnosMes.length === 0 || isNaN(n) || n <= 0) {
        return { diasHabituales: [], cupoMensual: 0 };
    }

    const frecuenciasPorDia = new Map();
    for (const t of turnosMes) {
        const dow = (t.horario && typeof t.horario.dia_semana === 'number')
            ? t.horario.dia_semana
            : new Date(t.fecha).getUTCDay();
        frecuenciasPorDia.set(dow, (frecuenciasPorDia.get(dow) || 0) + 1);
    }

    // Ordenar de mayor a menor frecuencia; en caso de empate, por dia_semana ascendente
    const diasOrdenados = Array.from(frecuenciasPorDia.entries())
        .sort((a, b) => (b[1] - a[1]) || (a[0] - b[0]))
        .map(entry => entry[0]);

    const diasHabituales = diasOrdenados.slice(0, n);
    if (diasHabituales.length < n) {
        return { diasHabituales, cupoMensual: 0 };
    }

    const cupoMensual = contarOcurrenciasDiaSemanaEnMes(year, month, diasHabituales);
    return { diasHabituales, cupoMensual };
}

// Lee el parámetro booleano permitirRecuperoMensual respetando precedencia por sucursal (branchId) y fallback global (null)
async function isPermitirRecuperoMensualEnabled(db, branchId = null) {
    if (branchId) {
        const branchParam = await db.parametroSistema.findFirst({
            where: { clave: 'permitirRecuperoMensual', branchId: parseInt(branchId) }
        });
        if (branchParam) return branchParam.valor === 'true';
    }
    const globalParam = await db.parametroSistema.findFirst({
        where: { clave: 'permitirRecuperoMensual', branchId: null }
    });
    return globalParam ? globalParam.valor === 'true' : false;
}

// Obtener horarios disponibles para el socio
const getClasesDisponibles = async (req, res) => {
    try {
        const { dia_semana, fecha } = req.query; // Para filtrar por el día seleccionado en el carrusel (1 a 6)

        let targetDate = new Date();
        if (fecha) {
            targetDate = new Date(fecha);
            targetDate.setUTCHours(0, 0, 0, 0);
        }

        // Buscar bloqueos activos para la fecha consultada
        const bloqueos = await req.db.aviso.findMany({
            where: {
                activo: true,
                esBloqueo: true,
                fechaDesde: { lte: targetDate },
                OR: [
                    { fechaHasta: { gte: targetDate } },
                    { fechaHasta: null }
                ]
            }
        });

        // Bloqueo estricto: Día Completo
        const bloqueoDiaCompleto = bloqueos.some(b => b.bloquearTodoElDia);
        if (bloqueoDiaCompleto) {
            return res.status(200).json({ success: true, data: [] });
        }

        const where = { activo: true };
        if (dia_semana) {
            where.dia_semana = parseInt(dia_semana);
        }

        const horarios = await req.db.horarioConfig.findMany({
            where,
            include: { 
                categoria: true,
                profesional: true,
                turnos: {
                    where: { estado: 'ACTIVO' },
                    include: { 
                        cliente: { 
                            select: { nombre: true, apellido: true } 
                        } 
                    }
                } // Solo trae turnos activos para el contador visual
            },
            orderBy: { hora_inicio: 'asc' }
        });

        // Filtrado adicional por Rango Horario o IDs específicos
        const horariosFiltradosPorBloqueo = horarios.filter(h => {
            const hInicioObj = new Date(h.hora_inicio);
            const horaClaseFormateada = String(hInicioObj.getUTCHours()).padStart(2, '0') + ':' + String(hInicioObj.getUTCMinutes()).padStart(2, '0');

            for (let b of bloqueos) {
                // 1. Filtrar por Turnos/Clases Específicas
                if (b.horariosBloqueados) {
                    let idsBloqueados = [];
                    try {
                        idsBloqueados = typeof b.horariosBloqueados === 'string' ? JSON.parse(b.horariosBloqueados) : b.horariosBloqueados;
                    } catch(e) {}
                    if (Array.isArray(idsBloqueados) && idsBloqueados.includes(h.id)) {
                        return false; // Bloqueado
                    }
                }
                
                // 2. Filtrar por Rango Horario
                if (b.horaInicioBloqueo && b.horaFinBloqueo) {
                    if (horaClaseFormateada >= b.horaInicioBloqueo && horaClaseFormateada <= b.horaFinBloqueo) {
                        return false; // Bloqueado
                    }
                }
            }
            return true; // Pasa el filtro
        });

        // Obtener configuración global para cupo máximo
        const configuracion = await req.db.configuracion.findFirst();
        const maxGlobal = configuracion?.cupoGlobal || 15;
        
        const ocultarInscriptos = await getOcultarInscriptosEnabled();

        // Formatear para facilitar uso en el front
        const horariosFormateados = horariosFiltradosPorBloqueo.map(h => {
            const turnosProcesados = ocultarInscriptos ? h.turnos.map(t => {
                const esPropio = req.user && req.user.id === t.clienteId;
                const { cliente, clienteId, ...restoTurno } = t;
                return { ...restoTurno, clienteId: esPropio ? t.clienteId : null };
            }) : h.turnos;

            return {
                id: h.id,
                dia_semana: h.dia_semana,
                hora_inicio: h.hora_inicio,
                hora_fin: h.hora_fin,
                categoriaId: h.categoriaId || h.categoria?.id || null,
                categoria: h.categoria,
                cupoMaximo: h.cupo_maximo ?? maxGlobal,
                turnos: turnosProcesados
            };
        });
        
        return res.status(200).json({
            success: true,
            ocultarInscriptos,
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

        const clienteIdInt = parseInt(clienteId);
        const horarioIdInt = parseInt(horarioId);

        if (req.user && req.user.id !== clienteIdInt) {
            return res.status(403).json({ success: false, message: 'No puedes reservar un turno para otro usuario' });
        }

        // 1. Asegurar que los cargos y la deuda estén actualizados
        await asegurarCargosAlDia(clienteIdInt);

        // Validar estado del cliente
        const clienteActual = await req.db.cliente.findUnique({
            where: { id: clienteIdInt },
            include: {
                plan: true
            }
        });

        if (!clienteActual) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        if (clienteActual.estado_cliente === 'INACTIVO') {
            return res.status(403).json({
                success: false,
                message: 'Tu cuenta está inactiva, comunicate con el gimnasio para regularizar tu pago'
            });
        }

        // Obtener parámetro de sistema para mora (fallback a true)
        const paramBloquearMora = await req.db.parametroSistema.findFirst({
            where: { clave: 'bloquearReservaPorMora' }
        });
        const bloquearPorMora = paramBloquearMora ? paramBloquearMora.valor === 'true' : true;

        const hoy = new Date();
        hoy.setUTCHours(0,0,0,0);
        
        let estaVencido = clienteActual.estado_pago === 'MOROSO';
        if (!estaVencido && clienteActual.vencimientoCuota) {
            const v = new Date(clienteActual.vencimientoCuota);
            v.setUTCHours(0,0,0,0);
            if (v < hoy) estaVencido = true;
        }

        if (bloquearPorMora && estaVencido) {
            return res.status(403).json({
                success: false,
                message: 'Tenés cuotas pendientes, regularizá tu pago para poder reservar'
            });
        }

        // Parsear fecha YYYY-MM-DD o ISO a YYYY-MM-DDT00:00:00.000Z (respetando fecha nominal en Argentina)
        const { isoDate: fechaIso } = extraerFechaNominalArgentina(fechaExacta);
        const d = new Date(`${fechaIso}T00:00:00.000Z`);

        // Transacción atómica con bloqueo pesimista por socio para evitar condiciones de carrera
        // (dos requests simultáneos del mismo socio no pueden superar el cupo semanal/mensual ni duplicar reserva)
        const txResult = await prisma.$transaction(async (tx) => {
            // Lock exclusivo sobre la fila del socio en InnoDB
            await tx.$queryRaw`SELECT id FROM clientes WHERE id = ${clienteIdInt} FOR UPDATE`;

            const branchWhere = req.branchId ? { branchId: req.branchId } : {};

            const horario = await tx.horarioConfig.findFirst({
                where: { id: horarioIdInt, ...branchWhere },
                include: { 
                    turnos: {
                        where: { 
                            fecha: d,
                            estado: 'ACTIVO',
                            ...branchWhere
                        }
                    } 
                }
            });

            if (!horario) {
                return { status: 404, body: { success: false, message: 'El horario solicitado no existe' } };
            }

            const configuracion = await tx.configuracion.findFirst();
            const maxGlobal = configuracion?.cupoGlobal || 15;
            const bloqueo = configuracion?.bloqueoCapacidad;
            const cupo = horario.cupo_maximo ?? maxGlobal;

            if (horario.turnos.length >= cupo && bloqueo) {
                return { status: 400, body: { success: false, message: 'Cupo máximo alcanzado' } };
            }

            // Validar límite de tiempo para reservar (ej: limiteCancelacionMinutos)
            const margenMinutos = configuracion?.limiteCancelacionMinutos || 60;
            // Construir la fecha/hora real de la clase forzando -03:00 (America/Argentina/Buenos_Aires)
            const hrObj = new Date(horario.hora_inicio);
            const hh = String(hrObj.getUTCHours()).padStart(2, '0');
            const mm = String(hrObj.getUTCMinutes()).padStart(2, '0');
            
            const fechaClaseExacta = new Date(`${fechaIso}T${hh}:${mm}:00-03:00`);
            const ahora = new Date();

            // Si ya pasó la clase o falta menos del margen permitido (asumiendo que sirve para reserva)
            const minutosFaltantes = (fechaClaseExacta.getTime() - ahora.getTime()) / (1000 * 60);
            if (minutosFaltantes < 0) {
                return {
                    status: 400,
                    body: {
                        success: false,
                        message: 'No puedes reservar un turno de una clase que ya pasó o está por empezar.'
                    }
                };
            }

            // Validar límite dinámico global por configuración.
            // NOTA: Si configuracion.maxReservasSemana > 0, se evalúa aquí ANTES del validador por Plan
            // y actúa como tope duro semanal global, bloqueando igual aunque permitirRecuperoMensual sea true.
            if (configuracion?.maxReservasSemana > 0) {
                const { lunes, domingo } = calcularRangoSemanaUTC(fechaIso);

                const turnosSemana = await tx.turnoCliente.count({
                    where: {
                        clienteId: clienteIdInt,
                        fecha: {
                            gte: lunes,
                            lte: domingo
                        },
                        ...branchWhere
                    }
                });

                if (turnosSemana >= configuracion.maxReservasSemana) {
                    return {
                        status: 400,
                        body: {
                            success: false,
                            message: "Has alcanzado tu límite máximo de clases permitidas para esta semana (Límite Global)."
                        }
                    };
                }
            }

            // Validar límite dinámico por Plan (si aplica)
            const plan = clienteActual.plan;
            if (plan && plan.cantidadClases !== null && plan.cantidadClases > 0) {
                const tipoFrec = plan.tipoFrecuencia || 'SEMANAL';
                let limiteExcedido = false;
                let rangoMsg = '';

                if (tipoFrec === 'SEMANAL') {
                    const { lunes, domingo } = calcularRangoSemanaUTC(fechaIso);

                    const count = await tx.turnoCliente.count({
                        where: {
                            clienteId: clienteIdInt,
                            fecha: { gte: lunes, lte: domingo },
                            ...branchWhere
                        }
                    });

                    if (count >= plan.cantidadClases) {
                        // El validador semanal bloquea. Evaluamos si aplica recupero mensual por mes calendario.
                        const permitirRecupero = await isPermitirRecuperoMensualEnabled(tx, req.branchId);

                        if (!permitirRecupero) {
                            limiteExcedido = true;
                            rangoMsg = 'esta semana';
                        } else {
                            const { inicioMes, finMes, year, month } = calcularRangoMesCalendarioUTC(fechaIso);

                            const turnosMes = await tx.turnoCliente.findMany({
                                where: {
                                    clienteId: clienteIdInt,
                                    fecha: { gte: inicioMes, lte: finMes },
                                    estado: { in: ['ACTIVO', 'CANCELADO_PENALIZADO'] },
                                    ...branchWhere
                                },
                                include: {
                                    horario: { select: { dia_semana: true } }
                                }
                            });

                            const turnosEnElMes = turnosMes.length;
                            const { diasHabituales, cupoMensual } = inferirDiasHabitualesYCupoMensual(
                                turnosMes,
                                plan.cantidadClases,
                                year,
                                month
                            );

                            // Si no tiene turnos suficientes en el mes para inferir sus N días habituales,
                            // o si ya alcanzó/superó el cupo mensual de ese mes calendario, bloquear igual que hoy.
                            if (diasHabituales.length < plan.cantidadClases || turnosEnElMes >= cupoMensual) {
                                limiteExcedido = true;
                                rangoMsg = 'esta semana';
                            }
                        }
                    }
                } else if (tipoFrec === 'MENSUAL') {
                    const diaMaximo = configuracion?.diaMaximoCobro || 10;
                    // calcularCicloActual recibe el próximo vencimiento (actualizado previamente) y devuelve el inicio y fin de mes
                    const { inicio, fin } = calcularCicloActual(clienteActual.vencimientoCuota, diaMaximo);
                    
                    // Las fechas que devuelve `calcularCicloActual` están en hora local 00:00:00 (desde Date)
                    // Para asegurarnos del count, las estandarizamos en UTC como las demás búsquedas
                    const inicioUTC = new Date(inicio);
                    inicioUTC.setUTCHours(0,0,0,0);
                    const finUTC = new Date(fin);
                    // El fin del ciclo (vencimiento) se considera el inicio del próximo, así que usamos lt: finUTC
                    finUTC.setUTCHours(0,0,0,0);

                    const count = await tx.turnoCliente.count({
                        where: { 
                            clienteId: clienteIdInt, 
                            fecha: { 
                                gte: inicioUTC, 
                                lt: finUTC 
                            },
                            ...branchWhere
                        }
                    });

                    if (count >= plan.cantidadClases) {
                        limiteExcedido = true;
                        const fechaReseteo = `${finUTC.getDate()}/${finUTC.getMonth() + 1}/${finUTC.getFullYear()}`;
                        rangoMsg = `tu ciclo mensual. Tus reservas se renuevan el ${fechaReseteo}`;
                    }
                }

                if (limiteExcedido) {
                    return {
                        status: 400,
                        body: {
                            success: false,
                            message: `Tu plan permite un máximo de ${plan.cantidadClases} clases. Has alcanzado el límite para ${rangoMsg}.`
                        }
                    };
                }
            }

            // Verificar si el usuario ya está anotado
            const yaAnotado = horario.turnos.find(t => t.clienteId === clienteIdInt);
            if (yaAnotado) {
                return {
                    status: 400,
                    body: {
                        success: false,
                        message: 'Ya estás anotado en esta clase'
                    }
                };
            }

            // Crear reserva TurnoCliente
            const nuevoTurno = await tx.turnoCliente.create({
                data: {
                    horarioId: horarioIdInt,
                    clienteId: clienteIdInt,
                    fecha: d,
                    estado: 'ACTIVO',
                    ...(req.branchId && { branchId: req.branchId })
                }
            });

            return {
                status: 201,
                body: {
                    success: true,
                    data: nuevoTurno,
                    message: '¡Turno reservado con éxito!'
                }
            };
        });

        return res.status(txResult.status).json(txResult.body);
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

        const turno = await req.db.turnoCliente.findUnique({
            where: { id: turnoId },
            include: { horario: true }
        });

        if (!turno) {
            return res.status(404).json({ success: false, message: 'Turno no encontrado' });
        }

        if (req.user && req.user.id !== turno.clienteId) {
            return res.status(403).json({ success: false, message: 'No puedes cancelar un turno que no es tuyo' });
        }

        const configuracion = await req.db.configuracion.findFirst();
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

        await req.db.turnoCliente.delete({
            where: { id: turnoId }
        });

        return res.status(200).json({
            success: true,
            message: 'Reserva cancelada con éxito'
        });
    } catch (error) {
        console.error('Error al cancelar turno:', error);
        if (error.code === 'P2002') {
            try {
                await req.db.turnoCliente.delete({ where: { id: parseInt(id) } });
                return res.status(200).json({
                    success: true,
                    message: 'Reserva cancelada con éxito (penalidad previa ya registrada)'
                });
            } catch (delErr) {
                console.error("Error al borrar duplicado en turnoSocio:", delErr);
            }
        }
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
