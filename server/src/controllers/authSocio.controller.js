const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_fluxer_key_123';

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
        const { nombre, apellido, dni_cuit, email, password } = req.body;

        // Validar campos requeridos
        if (!nombre || !apellido || !dni_cuit || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos: nombre, apellido, dni_cuit, email y password'
            });
        }

        // Buscar al cliente por email o dni_cuit
        const clienteExistente = await prisma.cliente.findFirst({
            where: {
                OR: [
                    { email },
                    { dni_cuit }
                ]
            }
        });

        if (clienteExistente) {
            // ── El cliente YA EXISTE ──

            // Si ya tiene password, significa que ya tiene cuenta activa
            if (clienteExistente.password) {
                return res.status(400).json({
                    success: false,
                    message: 'Este usuario ya tiene una cuenta activa. Inicia sesión.'
                });
            }

            // Si NO tiene password, activamos su cuenta vinculando la contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            const clienteActivado = await prisma.cliente.update({
                where: { id: clienteExistente.id },
                data: {
                    password: hashedPassword,
                    es_socio: true
                }
            });

            const { password: _, ...clienteData } = clienteActivado;

            return res.status(200).json({
                success: true,
                data: clienteData,
                message: 'Cuenta vinculada y activada con éxito.'
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
                password: hashedPassword,
                es_socio: true
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

        // Comparar contraseña
        const isMatch = await bcrypt.compare(password, cliente.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }

        // Generar token JWT
        const payload = {
            id: cliente.id,
            nombre: cliente.nombre,
            apellido: cliente.apellido,
            role: 'SOCIO'
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

        // Retornar token y datos del cliente sin la contraseña
        const { password: _, ...clienteData } = cliente;

        return res.status(200).json({
            success: true,
            data: {
                token,
                cliente: clienteData
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
