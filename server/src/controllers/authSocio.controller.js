const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("CRITICAL: JWT_SECRET no está configurado en las variables de entorno.");
}

/**
 * Registra o activa la cuenta de un socio (cliente) en el sistema.
 * Recibe: nombre, apellido, dni_cuit, email, password
 *
 * Flujo inteligente:
 * - Si el cliente ya existe CON password → Error (ya tiene cuenta activa)
 * - Si el cliente ya existe SIN password → Vincula la cuenta (update)
 * - Si el cliente NO existe → Crea desde cero (create)
 */
const registerSocio = async (req, res) => {
    try {
        const { nombre, apellido, dni_cuit, email, password, telefono } = req.body;

        // Validar campos requeridos
        if (!nombre || !apellido || !dni_cuit || !email || !password || !telefono) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos, incluyendo el teléfono.'
            });
        }

        // Buscar cliente por email y por DNI por separado para validación cruzada
        const emailExistente = await prisma.cliente.findFirst({ where: { email } });
        const dniExistente = await prisma.cliente.findFirst({ where: { dni_cuit } });

        // Si el email ya está en uso por otro DNI, rechazar
        if (emailExistente && (!dniExistente || emailExistente.id !== dniExistente.id)) {
            return res.status(400).json({
                success: false,
                message: 'Este email ya está en uso por otro cliente.'
            });
        }

        if (dniExistente) {
            // ── El cliente YA EXISTE ──
            if (dniExistente.password) {
                return res.status(400).json({
                    success: false,
                    message: 'Este usuario ya tiene una cuenta activa. Inicia sesión.'
                });
            }

            // Completar datos, vincular contraseña y marcar como PENDIENTE
            const hashedPassword = await bcrypt.hash(password, 10);
            const notasAnteriores = dniExistente.observaciones ? `${dniExistente.observaciones} | ` : '';
            
            const clienteActivado = await prisma.cliente.update({
                where: { id: dniExistente.id },
                data: {
                    password: hashedPassword,
                    es_socio: true,
                    estado_cliente: 'PENDIENTE',
                    email,
                    telefono,
                    origenSolicitud: 'ACTUALIZACION_DNI',
                    observaciones: `${notasAnteriores}Completó datos de registro por web/app.`
                }
            });

            const { password: _, ...clienteData } = clienteActivado;

            return res.status(200).json({
                success: true,
                data: clienteData,
                message: 'Cuenta vinculada, datos guardados y enviada a revisión.'
            });
        }

        // ── El cliente NO EXISTE → Crear desde cero ──
        const hashedPassword = await bcrypt.hash(password, 10);

        const nuevoCliente = await prisma.cliente.create({
            data: {
                nombre,
                apellido,
                dni_cuit,
                email,
                telefono,
                password: hashedPassword,
                es_socio: true,
                estado_cliente: 'PENDIENTE',
                origenSolicitud: 'NUEVO'
            }
        });

        const { password: _, ...clienteData } = nuevoCliente;

        return res.status(201).json({
            success: true,
            data: clienteData,
            message: 'Cuenta creada con éxito.'
        });

    } catch (error) {
        console.error('Error en registerSocio:', error);
        return res.status(500).json({
            success: false,
            message: 'Error en el servidor al registrar socio'
        });
    }
};

/**
 * Login de un socio (cliente) existente.
 * Recibe: email, password
 * Devuelve: token JWT + datos básicos del cliente
 */
const loginSocio = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar campos requeridos
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar al cliente por email
        const cliente = await prisma.cliente.findUnique({
            where: { email }
        });

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró un socio con ese email'
            });
        }

        // Verificar que el cliente tenga contraseña configurada
        if (!cliente.password) {
            return res.status(401).json({
                success: false,
                message: 'Este socio no tiene acceso a la app. Contacte al administrador.'
            });
        }

        // Si la cuenta está en revisión, bloquear el acceso con 403
        if (cliente.estado_cliente === 'PENDIENTE') {
            return res.status(403).json({
                success: false,
                message: 'Tu cuenta está pendiente de aprobación.'
            });
        }

        // Comparar contraseña
        const isMatch = await bcrypt.compare(password, cliente.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }

        // Asegurar cargos al día antes de devolver el perfil
        const { asegurarCargosAlDia } = require('../services/cargos.service');
        await asegurarCargosAlDia(cliente.id);

        const clienteActualizado = await prisma.cliente.findUnique({
            where: { id: cliente.id }
        });

        // Generar token JWT
        const payload = {
            id: clienteActualizado.id,
            nombre: clienteActualizado.nombre,
            apellido: clienteActualizado.apellido,
            role: 'SOCIO'
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

        // Detectar si el usuario ingresó con clave 123456
        const isDefaultPassword = password === '123456';

        const { password: _, ...clienteData } = clienteActualizado;

        return res.status(200).json({
            success: true,
            data: {
                token,
                cliente: clienteData,
                defaultPassword: isDefaultPassword
            },
            message: 'Login exitoso'
        });

    } catch (error) {
        console.error('Error en loginSocio:', error);
        return res.status(500).json({
            success: false,
            message: 'Error en el servidor al iniciar sesión'
        });
    }
};

module.exports = {
    registerSocio,
    loginSocio
};
