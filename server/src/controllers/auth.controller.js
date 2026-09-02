const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("CRITICAL: JWT_SECRET no está configurado en las variables de entorno.");
}

const login = async (req, res) => {
    try {
        const { loginInput, password } = req.body;

        if (!loginInput || !password) {
            return res.status(400).json({ success: false, message: 'Usuario/Email y contraseña requeridos' });
        }

        const usuario = await prisma.usuario.findFirst({
            where: {
                OR: [
                    { email: loginInput },
                    { usuario: loginInput }
                ]
            }
        });

        if (!usuario) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, usuario.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        // Token payload
        const payload = {
            id: usuario.id,
            nombre: usuario.nombre,
            esSuperAdmin: usuario.esSuperAdmin,
            esAdmin: usuario.esAdmin,
            permisoFinanzas: usuario.permisoFinanzas,
            permisoTurnos: usuario.permisoTurnos,
            permisoClientes: usuario.permisoClientes,
            permisoPlanes: usuario.permisoPlanes,
            permisoFeriados: usuario.permisoFeriados
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

        return res.status(200).json({
            success: true,
            data: {
                token,
                usuario: payload
            },
            message: 'Login exitoso'
        });

    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const registrarUsuario = async (req, res) => {
    try {
        const { 
            nombre, usuario, email, password, 
            esSuperAdmin, esAdmin, 
            permisoFinanzas, permisoTurnos, 
            permisoClientes, permisoPlanes, permisoFeriados 
        } = req.body;

        if (!nombre || !usuario || !email || !password) {
            return res.status(400).json({ success: false, message: 'Nombre, usuario, email y contraseña requeridos' });
        }

        const existingUser = await prisma.usuario.findFirst({ 
            where: { 
                OR: [
                    { email },
                    { usuario }
                ]
            } 
        });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'El email o usuario ya está registrado' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const newUser = await prisma.usuario.create({
            data: {
                nombre,
                usuario,
                email,
                password: hashedPassword,
                esSuperAdmin: esSuperAdmin || false,
                esAdmin: esAdmin || false,
                permisoFinanzas: permisoFinanzas || false,
                permisoTurnos: permisoTurnos || false,
                permisoClientes: permisoClientes || false,
                permisoPlanes: permisoPlanes || false,
                permisoFeriados: permisoFeriados || false,
            }
        });

        // Retornar usuario creado sin password
        const { password: _, ...userData } = newUser;

        return res.status(201).json({
            success: true,
            data: userData,
            message: 'Usuario registrado con éxito'
        });

    } catch (error) {
        console.error('Error en registrarUsuario:', error);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

const getUsuarios = async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany({
            select: {
                id: true,
                nombre: true,
                usuario: true,
                email: true,
                esSuperAdmin: true,
                esAdmin: true,
                permisoFinanzas: true,
                permisoTurnos: true,
                permisoClientes: true,
                permisoPlanes: true,
                permisoFeriados: true
            }
        });

        return res.status(200).json({
            success: true,
            data: usuarios
        });
    } catch (error) {
        console.error('Error en getUsuarios:', error);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
}

const editarUsuario = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        const usuarioExistente = await prisma.usuario.findUnique({
            where: { id }
        });

        if (!usuarioExistente) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        if (usuarioExistente.esSuperAdmin && !req.user.esSuperAdmin) {
            return res.status(403).json({ success: false, message: 'No puedes editar a un Super Administrador' });
        }

        const { 
            nombre, usuario, email, password, 
            esAdmin, 
            permisoFinanzas, permisoTurnos, 
            permisoClientes, permisoPlanes, permisoFeriados 
        } = req.body;

        const updateData = {
            nombre,
            usuario,
            email
        };

        const isSelfEditing = (id === req.user.id);
        const canEditPermissions = req.user.esSuperAdmin || !isSelfEditing;

        if (canEditPermissions) {
            updateData.esAdmin = esAdmin || false;
            updateData.permisoFinanzas = permisoFinanzas || false;
            updateData.permisoTurnos = permisoTurnos || false;
            updateData.permisoClientes = permisoClientes || false;
            updateData.permisoPlanes = permisoPlanes || false;
            updateData.permisoFeriados = permisoFeriados || false;
        }

        if (password && password.trim() !== '') {
            updateData.password = bcrypt.hashSync(password, 10);
        }

        const updatedUser = await prisma.usuario.update({
            where: { id },
            data: updateData
        });

        const { password: _, ...userData } = updatedUser;

        return res.status(200).json({
            success: true,
            data: userData,
            message: 'Usuario actualizado con éxito'
        });

    } catch (error) {
        console.error('Error en editarUsuario:', error);
        return res.status(500).json({ success: false, message: 'Error en el servidor al editar' });
    }
};

const eliminarUsuario = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const usuarioExistente = await prisma.usuario.findUnique({
            where: { id }
        });

        if (!usuarioExistente) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        if (usuarioExistente.esSuperAdmin && !req.user.esSuperAdmin) {
            return res.status(403).json({ success: false, message: 'No puedes eliminar a un Super Administrador' });
        }

        await prisma.usuario.delete({
            where: { id }
        });

        return res.status(200).json({
            success: true,
            message: 'Usuario eliminado con éxito'
        });

    } catch (error) {
        console.error('Error en eliminarUsuario:', error);
        return res.status(500).json({ success: false, message: 'Error en el servidor al eliminar' });
    }
};

module.exports = {
    login,
    registrarUsuario,
    getUsuarios,
    editarUsuario,
    eliminarUsuario
};
