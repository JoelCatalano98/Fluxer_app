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

        if (req.user && req.user.id !== id) {
            return res.status(403).json({ success: false, message: 'No puedes acceder a un perfil que no es tuyo' });
        }

        const { asegurarCargosAlDia } = require('../services/cargos.service');
        const resultCargos = await asegurarCargosAlDia(id);

        const { getMultiDisciplinaEnabled } = require('../config/multiDisciplinaCache');
        const isMulti = await getMultiDisciplinaEnabled(req.db);

        const includeConfig = {
            categoria: true,
            plan: true,
            ...(isMulti && {
                clienteCategorias: {
                    include: {
                        categoria: true
                    }
                }
            })
        };

        let cliente;
        try {
            cliente = await req.db.cliente.findUnique({
                where: { id },
                include: includeConfig
            });
        } catch (dbErr) {
            if (dbErr.code === 'P2021' || dbErr.message?.includes('cliente_categorias')) {
                console.warn('⚠️ [obtenerPerfil] Tabla cliente_categorias no disponible en base. Fallback.');
                cliente = await req.db.cliente.findUnique({
                    where: { id },
                    include: {
                        categoria: true,
                        plan: true
                    }
                });
            } else {
                throw dbErr;
            }
        }

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Socio no encontrado'
            });
        }

        // Omitir el password de la respuesta y mapear lista de categorías
        const { password, ...clienteData } = cliente;
        let listaCategorias = cliente.clienteCategorias && cliente.clienteCategorias.length > 0
            ? cliente.clienteCategorias.map(cc => cc.categoria).filter(Boolean)
            : (cliente.categoria ? [cliente.categoria] : []);
        if (cliente.categoriaId && listaCategorias.length > 1) {
            listaCategorias.sort((a, b) => (a.id === cliente.categoriaId ? -1 : b.id === cliente.categoriaId ? 1 : 0));
        }
        clienteData.categorias = listaCategorias;

        return res.status(200).json({
            success: true,
            data: clienteData,
            message: 'Perfil obtenido con éxito',
            ...(resultCargos?.limiteAlcanzado && { limiteAlcanzado: true })
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

        if (req.user && req.user.id !== id) {
            return res.status(403).json({ success: false, message: 'No puedes modificar un perfil que no es tuyo' });
        }

        const { nombre, apellido, dni_cuit, email, telefono } = req.body;

        const clienteActualizado = await req.db.cliente.update({
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

        if (req.user && req.user.id !== id) {
            return res.status(403).json({ success: false, message: 'No puedes cambiar el password de otro usuario' });
        }

        const { passwordActual, nuevoPassword } = req.body;

        if (!passwordActual || !nuevoPassword) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña actual y la nueva contraseña son requeridas'
            });
        }

        // Buscar al cliente
        const cliente = await req.db.cliente.findUnique({
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

        await req.db.cliente.update({
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
