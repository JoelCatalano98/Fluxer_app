const prisma = require('../config/prisma');

// Obtener todas las rutinas del libro (activas por defecto)
const obtenerRutinasLibro = async (req, res) => {
    try {
        const { search, all } = req.query;
        
        const whereClause = {
            ...(req.branchId ? { branchId: req.branchId } : {})
        };
        
        if (all !== 'true') {
            whereClause.activa = true;
        }

        if (search) {
            whereClause.nombre = { contains: search };
        }

        const rutinas = await req.db.rutinaLibro.findMany({
            where: whereClause,
            include: {
                fases: {
                    include: {
                        ejercicios: true
                    },
                    orderBy: {
                        orden: 'asc'
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            data: rutinas,
            message: 'Rutinas del libro obtenidas exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener rutinas del libro:', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

// Crear nueva rutina en el libro
const crearRutinaLibro = async (req, res) => {
    try {
        const { nombre, fases } = req.body;

        if (!nombre || !fases || !Array.isArray(fases)) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
        }

        const nuevaRutina = await req.db.rutinaLibro.create({
            data: {
                nombre,
                branchId: req.branchId || null,
                fases: {
                    create: fases.map((fase, i) => ({
                        nombre: fase.nombre,
                        orden: fase.orden || (i + 1),
                        ejercicios: {
                            create: (fase.ejercicios || []).map(ej => ({
                                nombreEjercicio: ej.nombreEjercicio || ej.nombre,
                                series: parseInt(ej.series) || 0,
                                repeticiones: String(ej.repeticiones || ''),
                                descanso: ej.descanso ? String(ej.descanso) : null,
                                pesoSugerido: ej.pesoSugerido ? String(ej.pesoSugerido) : null,
                                videoUrl: ej.videoUrl ? String(ej.videoUrl) : null,
                                notas: ej.notas ? String(ej.notas) : null
                            }))
                        }
                    }))
                }
            },
            include: {
                fases: {
                    include: { ejercicios: true }
                }
            }
        });

        res.status(201).json({
            success: true,
            data: nuevaRutina,
            message: 'Rutina creada exitosamente en el libro'
        });
    } catch (error) {
        console.error('Error al crear rutina en el libro:', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

// Actualizar rutina del libro
const actualizarRutinaLibro = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, fases } = req.body;

        if (!nombre || !fases || !Array.isArray(fases)) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
        }

        const rutinaId = parseInt(id);

        const rutinaActualizada = await req.db.$transaction(async (tx) => {
            // Validar que exista en el branch actual si corresponde
            const whereClause = req.branchId
                ? { id: rutinaId, branchId: req.branchId }
                : { id: rutinaId };

            const rutina = await tx.rutinaLibro.findFirst({
                where: whereClause,
                include: { fases: { orderBy: { orden: 'asc' } } }
            });
            if (!rutina) {
                const err = new Error('Rutina no encontrada');
                err.code = 'P2025';
                throw err;
            }

            const activeAssignments = await tx.asignacionRutinaLibro.findMany({
                where: { rutinaLibroId: rutinaId, estado: 'activa' }
            });

            const oldPhaseIndexMap = {};
            rutina.fases.forEach((f, idx) => {
                oldPhaseIndexMap[f.id] = idx;
            });

            // Actualizar nombre
            await tx.rutinaLibro.update({
                where: { id: rutinaId },
                data: { nombre }
            });

            // Borrar todas las fases (el cascade borrará los ejercicios)
            await tx.faseLibro.deleteMany({
                where: { rutinaLibroId: rutinaId }
            });

            const newPhases = [];
            // Recrear fases y ejercicios
            for (let i = 0; i < fases.length; i++) {
                const fase = fases[i];
                const nuevaFase = await tx.faseLibro.create({
                    data: {
                        rutinaLibroId: rutinaId,
                        nombre: fase.nombre,
                        orden: fase.orden || (i + 1),
                        ejercicios: {
                            create: (fase.ejercicios || []).map(ej => ({
                                nombreEjercicio: ej.nombreEjercicio || ej.nombre,
                                series: parseInt(ej.series) || 0,
                                repeticiones: String(ej.repeticiones || ''),
                                descanso: ej.descanso ? String(ej.descanso) : null,
                                pesoSugerido: ej.pesoSugerido ? String(ej.pesoSugerido) : null,
                                videoUrl: ej.videoUrl ? String(ej.videoUrl) : null,
                                notas: ej.notas ? String(ej.notas) : null
                            }))
                        }
                    }
                });
                newPhases.push(nuevaFase);
            }

            for (const asig of activeAssignments) {
                if (asig.faseActualId) {
                    const oldIndex = oldPhaseIndexMap[asig.faseActualId];
                    if (oldIndex !== undefined) {
                        const newIndex = Math.min(oldIndex, newPhases.length - 1);
                        await tx.asignacionRutinaLibro.update({
                            where: { id: asig.id },
                            data: { faseActualId: newPhases[newIndex].id }
                        });
                    } else if (newPhases.length > 0) {
                        await tx.asignacionRutinaLibro.update({
                            where: { id: asig.id },
                            data: { faseActualId: newPhases[0].id }
                        });
                    }
                } else if (newPhases.length > 0) {
                    await tx.asignacionRutinaLibro.update({
                        where: { id: asig.id },
                        data: { faseActualId: newPhases[0].id }
                    });
                }
            }

            return await tx.rutinaLibro.findUnique({
                where: { id: rutinaId },
                include: {
                    fases: {
                        include: { ejercicios: true },
                        orderBy: { orden: 'asc' }
                    }
                }
            });
        });

        res.status(200).json({
            success: true,
            data: rutinaActualizada,
            message: 'Rutina actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar rutina del libro:', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

// Asignar rutina a múltiples clientes
const asignarRutinaLibro = async (req, res) => {
    try {
        const { clienteIds, rutinaLibroId } = req.body;

        if (!clienteIds || !Array.isArray(clienteIds) || clienteIds.length === 0 || !rutinaLibroId) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos o clienteIds no es un arreglo.' });
        }

        // Buscar la primera fase de la rutina para asignarla como fase actual
        const primeraFase = await req.db.faseLibro.findFirst({
            where: { rutinaLibroId: parseInt(rutinaLibroId) },
            orderBy: { orden: 'asc' }
        });

        const asignados = [];
        const fallidos = [];

        for (const cId of clienteIds) {
            const clienteId = parseInt(cId);
            
            // Verificar si el cliente ya tiene una asignación activa
            const asignacionActiva = await req.db.asignacionRutinaLibro.findFirst({
                where: {
                    clienteId: clienteId,
                    estado: 'activa'
                }
            });

            if (asignacionActiva) {
                fallidos.push(clienteId);
                continue;
            }

            const nuevaAsignacion = await req.db.asignacionRutinaLibro.create({
                data: {
                    clienteId: clienteId,
                    rutinaLibroId: parseInt(rutinaLibroId),
                    faseActualId: primeraFase ? primeraFase.id : null,
                    estado: 'activa'
                }
            });
            asignados.push(nuevaAsignacion.id);
        }

        if (asignados.length === 0 && fallidos.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los clientes seleccionados ya tienen una rutina asignada y activa.' 
            });
        }

        let message = `Rutina asignada exitosamente a ${asignados.length} cliente(s).`;
        if (fallidos.length > 0) {
            message += ` Omitidos ${fallidos.length} cliente(s) por tener rutinas ya activas.`;
        }

        res.status(201).json({
            success: true,
            data: { asignados, fallidos },
            message
        });
    } catch (error) {
        console.error('Error al asignar rutina:', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

// Avanzar de fase
const avanzarFase = async (req, res) => {
    try {
        const { id } = req.params;
        const { nuevaFaseId } = req.body; // Puede ser null si es cerrar la última y quedar sin fase, pero no completa.

        const asignacion = await req.db.asignacionRutinaLibro.findUnique({
            where: { id: parseInt(id) }
        });

        if (!asignacion) {
            return res.status(404).json({ success: false, message: 'Asignación no encontrada' });
        }

        if (asignacion.estado === 'completada') {
            return res.status(400).json({ success: false, message: 'La asignación ya está completada' });
        }

        await req.db.$transaction(async (tx) => {
            // Si estaba en una fase, guardarla en historial
            if (asignacion.faseActualId) {
                await tx.historialFaseCompletada.create({
                    data: {
                        asignacionId: asignacion.id,
                        faseLibroId: asignacion.faseActualId
                    }
                });
            }

            // Actualizar fase actual
            await tx.asignacionRutinaLibro.update({
                where: { id: asignacion.id },
                data: {
                    faseActualId: nuevaFaseId ? parseInt(nuevaFaseId) : null
                }
            });
        });

        res.status(200).json({
            success: true,
            message: 'Fase avanzada exitosamente'
        });
    } catch (error) {
        console.error('Error al avanzar fase:', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

// Completar asignación
const completarAsignacion = async (req, res) => {
    try {
        const { id } = req.params;

        const asignacion = await req.db.asignacionRutinaLibro.update({
            where: { id: parseInt(id) },
            data: {
                estado: 'completada',
                fechaCompletada: new Date()
            }
        });

        res.status(200).json({
            success: true,
            data: asignacion,
            message: 'Asignación completada exitosamente'
        });
    } catch (error) {
        console.error('Error al completar asignación:', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

// Obtener rutina asignada del alumno (SÓLO NOMBRE)
const obtenerRutinaAlumno = async (req, res) => {
    try {
        const { clienteId } = req.params;

        // Se busca la asignación ACTIVA
        const asignacionActiva = await req.db.asignacionRutinaLibro.findFirst({
            where: {
                clienteId: parseInt(clienteId),
                estado: 'activa'
            },
            include: {
                rutinaLibro: {
                    select: {
                        nombre: true,
                        fases: true
                    }
                }
            }
        });

        if (asignacionActiva) {
            let nombreFinal = asignacionActiva.rutinaLibro.nombre;
            const faseActual = asignacionActiva.rutinaLibro.fases.find(f => f.id === asignacionActiva.faseActualId) || asignacionActiva.rutinaLibro.fases[0];
            if (faseActual) {
                nombreFinal = `${nombreFinal} (${faseActual.nombre})`;
            }
            asignacionActiva.rutinaLibro.nombre = nombreFinal;
            delete asignacionActiva.rutinaLibro.fases;
        }

        res.status(200).json({
            success: true,
            data: asignacionActiva || null,
            message: 'Rutina del alumno obtenida'
        });
    } catch (error) {
        console.error('Error al obtener rutina del alumno:', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

// Obtener historial de una asignación
const obtenerHistorialAsignacion = async (req, res) => {
    try {
        const { id } = req.params;

        const historial = await req.db.historialFaseCompletada.findMany({
            where: { asignacionId: parseInt(id) },
            orderBy: { fechaCierre: 'desc' }
        });

        res.status(200).json({
            success: true,
            data: historial,
            message: 'Historial obtenido exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

// Obtener asignaciones (activas, completadas o todas)
const obtenerAsignaciones = async (req, res) => {
    try {
        const { estado } = req.query;
        
        const whereClause = {};
        if (estado === 'activa' || estado === 'completada') {
            whereClause.estado = estado;
        }

        const asignaciones = await req.db.asignacionRutinaLibro.findMany({
            where: whereClause,
            include: {
                cliente: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        dni_cuit: true,
                        codigo_socio: true
                    }
                },
                rutinaLibro: {
                    include: {
                        fases: {
                            orderBy: { orden: 'asc' }
                        }
                    }
                }
            },
            orderBy: {
                fechaInicio: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            data: asignaciones,
            message: 'Asignaciones obtenidas exitosamente'
        });
    } catch (error) {
        console.error('Error al obtener asignaciones:', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};

module.exports = {
    obtenerRutinasLibro,
    crearRutinaLibro,
    actualizarRutinaLibro,
    asignarRutinaLibro,
    avanzarFase,
    completarAsignacion,
    obtenerRutinaAlumno,
    obtenerHistorialAsignacion,
    obtenerAsignaciones
};
