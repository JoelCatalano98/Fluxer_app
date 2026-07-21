const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

/**
 * GET /api/socio/perfil/:id
 * Obtiene los datos del perfil del socio (sin password)
 */
const obtenerPerfil = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente no válido'
            });
        }

        const cliente = await prisma.cliente.findUnique({
            where: { id },
            include: {
                categoria: {
                    include: { plan: true }
                },
                plan: {
                    include: { categoria: true }
                }
            }
        });

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Socio no encontrado'
            });
        }

        // Omitir el password de la respuesta
        const { password, ...clienteData } = cliente;

        return res.status(200).json({
            success: true,
            data: clienteData,
            message: 'Perfil obtenido con éxito'
        });
    } catch (error) {
        console.error('Error en obtenerPerfil:', error);
        return res.status(500).json({
            success: false,
            message: 'Error en el servidor al obtener el perfil'
        });
    }
};

/**
 * PUT /api/socio/perfil/:id
 * Actualiza nombre, apellido, dni_cuit, email y telefono del socio
 */
const actualizarPerfil = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente no válido'
            });
        }

        const { nombre, apellido, dni_cuit, email, telefono } = req.body;

        const clienteActualizado = await prisma.cliente.update({
            where: { id },
            data: {
                ...(nombre !== undefined && { nombre }),
                ...(apellido !== undefined && { apellido }),
                ...(dni_cuit !== undefined && { dni_cuit }),
                ...(email !== undefined && { email: email || null }),
                ...(telefono !== undefined && { telefono: telefono || null }),
            }
        });

        const { password, ...clienteData } = clienteActualizado;

        return res.status(200).json({
            success: true,
            data: clienteData,
            message: 'Perfil actualizado con éxito'
        });
    } catch (error) {
        console.error('Error en actualizarPerfil:', error);

        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Socio no encontrado'
            });
        }

        if (error.code === 'P2002') {
            const targets = error.meta?.target || 'campos únicos';
            return res.status(400).json({
                success: false,
                message: `Conflicto de datos duplicados en: ${targets}. El DNI/CUIT o Email ya está en uso.`
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error en el servidor al actualizar el perfil'
        });
    }
};

/**
 * PUT /api/socio/perfil/:id/password
 * Cambia la contraseña del socio. Requiere passwordActual y nuevoPassword.
 */
const cambiarPassword = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente no válido'
            });
        }

        const { passwordActual, nuevoPassword } = req.body;

        if (!passwordActual || !nuevoPassword) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña actual y la nueva contraseña son requeridas'
            });
        }

        // Buscar al cliente
        const cliente = await prisma.cliente.findUnique({
            where: { id }
        });

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Socio no encontrado'
            });
        }

        if (!cliente.password) {
            return res.status(400).json({
                success: false,
                message: 'Este socio no tiene contraseña configurada'
            });
        }

        // Comparar contraseña actual
        const isMatch = await bcrypt.compare(passwordActual, cliente.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'La contraseña actual es incorrecta'
            });
        }

        // Encriptar y guardar la nueva contraseña
        const hashedPassword = await bcrypt.hash(nuevoPassword, 10);

        await prisma.cliente.update({
            where: { id },
            data: { password: hashedPassword }
        });

        return res.status(200).json({
            success: true,
            message: 'Contraseña actualizada con éxito'
        });
    } catch (error) {
        console.error('Error en cambiarPassword:', error);
        return res.status(500).json({
            success: false,
            message: 'Error en el servidor al cambiar la contraseña'
        });
    }
};

module.exports = {
    obtenerPerfil,
    actualizarPerfil,
    cambiarPassword
};
