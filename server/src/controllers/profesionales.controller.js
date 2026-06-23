const prisma = require('../config/prisma');

// GET /api/profesionales
const getProfesionales = async (req, res) => {
    try {
        const profesionales = await prisma.profesional.findMany({
            where: { activo: true },
            orderBy: {
                id: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            data: profesionales,
            message: 'Profesionales obtenidos con éxito'
        });
    } catch (error) {
        console.error('Error al obtener profesionales:', error);
        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al obtener profesionales'
        });
    }
};

// POST /api/profesionales
const createProfesional = async (req, res) => {
    try {
        const {
            nombre,
            apellido,
            dni,
            especialidad,
            matricula,
            email,
            telefono
        } = req.body;

        // Validar campos obligatorios
        if (!nombre || !apellido || !dni) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'Los campos nombre, apellido y dni son obligatorios'
            });
        }

        const nuevoProfesional = await prisma.profesional.create({
            data: {
                nombre,
                apellido,
                dni,
                especialidad: especialidad || null,
                matricula: matricula || null,
                email: email || null,
                telefono: telefono || null,
                activo: true
            }
        });

        return res.status(201).json({
            success: true,
            data: nuevoProfesional,
            message: 'Profesional registrado con éxito'
        });
    } catch (error) {
        console.error('Error al crear profesional:', error);

        if (error.code === 'P2002') {
            const targets = error.meta?.target || 'campos únicos';
            return res.status(400).json({
                success: false,
                data: null,
                message: `Conflicto de datos duplicados en: ${targets}. Por favor verifica el DNI o Email.`
            });
        }

        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al registrar el profesional'
        });
    }
};

// PUT /api/profesionales/:id
const updateProfesional = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'ID de profesional no válido'
            });
        }

        const {
            nombre,
            apellido,
            dni,
            especialidad,
            matricula,
            email,
            telefono,
            activo
        } = req.body;

        // Validar que los campos obligatorios no se envíen vacíos si están presentes
        if (nombre === '' || apellido === '' || dni === '') {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'Los campos nombre, apellido y dni no pueden estar vacíos'
            });
        }

        const updateData = {};
        if (nombre !== undefined) updateData.nombre = nombre;
        if (apellido !== undefined) updateData.apellido = apellido;
        if (dni !== undefined) updateData.dni = dni;
        if (especialidad !== undefined) updateData.especialidad = especialidad || null;
        if (matricula !== undefined) updateData.matricula = matricula || null;
        if (email !== undefined) updateData.email = email || null;
        if (telefono !== undefined) updateData.telefono = telefono || null;
        if (activo !== undefined) updateData.activo = activo;

        const profesionalActualizado = await prisma.profesional.update({
            where: { id },
            data: updateData
        });

        return res.status(200).json({
            success: true,
            data: profesionalActualizado,
            message: 'Profesional actualizado con éxito'
        });
    } catch (error) {
        console.error('Error al actualizar profesional:', error);

        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Profesional no encontrado'
            });
        }

        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'El DNI o Email ya está en uso por otro profesional'
            });
        }

        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al actualizar el profesional'
        });
    }
};

// DELETE /api/profesionales/:id
const deleteProfesional = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: 'ID de profesional no válido'
            });
        }

        const profesionalDesactivado = await prisma.profesional.update({
            where: { id },
            data: {
                activo: false
            }
        });

        return res.status(200).json({
            success: true,
            data: profesionalDesactivado,
            message: 'Profesional dado de baja con éxito'
        });
    } catch (error) {
        console.error('Error al dar de baja profesional:', error);

        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'Profesional no encontrado'
            });
        }

        return res.status(500).json({
            success: false,
            data: null,
            message: 'Error interno del servidor al dar de baja el profesional'
        });
    }
};

module.exports = {
    getProfesionales,
    createProfesional,
    updateProfesional,
    deleteProfesional
};
