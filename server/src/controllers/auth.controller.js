const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getMultiSucursalEnabled } = require('../config/branchCache');
const { JWT_SECRET, BRANCH_SELECTION_SCOPE } = require('../middlewares/auth.middleware');

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

        // Payload base de permisos (sin branchId aún)
        const basePayload = {
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

        // ── Flujo multi-sucursal ──────────────────────────────────────────
        const isMultiEnabled = await getMultiSucursalEnabled();

        if (isMultiEnabled) {
            // Buscar sucursales activas asignadas al usuario
            const asignaciones = await prisma.usuarioSucursal.findMany({
                where: { usuarioId: usuario.id },
                include: { branch: { where: { activa: true } } }
            });
            const branches = asignaciones
                .filter(a => a.branch !== null)
                .map(a => ({ id: a.branch.id, nombre: a.branch.nombre, direccion: a.branch.direccion }));

            if (branches.length === 0) {
                // Usuario sin sucursales asignadas — error de configuración
                return res.status(403).json({
                    success: false,
                    message: 'Este usuario no tiene sucursales asignadas. Contactar al administrador.'
                });
            }

            if (branches.length === 1) {
                // Una sola sucursal → incluir branchId en el token directamente
                const payload = { ...basePayload, branchId: branches[0].id };
                const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
                return res.status(200).json({
                    success: true,
                    data: { token, usuario: payload },
                    message: 'Login exitoso'
                });
            }

            // Dos o más sucursales → emitir token temporal de selección
            // scope: 'branch-selection-only' — NO sirve para acceder a rutas operativas
            // Expira en 5 minutos — ventana suficiente para seleccionar
            const tempToken = jwt.sign(
                { id: usuario.id, scope: BRANCH_SELECTION_SCOPE },
                JWT_SECRET,
                { expiresIn: '5m' }
            );
            return res.status(200).json({
                success: true,
                needsBranchSelection: true,
                tempToken,   // frontend lo guarda en memoria (NO en localStorage)
                branches,
                message: 'Seleccioná una sucursal para continuar'
            });
        }

        // ── Flujo estándar (sin multi-sucursal) — comportamiento actual ───
        const token = jwt.sign(basePayload, JWT_SECRET, { expiresIn: '30d' });
        return res.status(200).json({
            success: true,
            data: { token, usuario: basePayload },
            message: 'Login exitoso'
        });

    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

/**
 * POST /api/auth/select-branch
 *
 * Recibe el token temporal (scope: 'branch-selection-only') y el branchId elegido.
 * Valida que el branchId pertenezca al usuario en UsuarioSucursal.
 * Emite el JWT definitivo con branchId incluido.
 *
 * Protegido por verifyTempToken (en auth.routes.js) — no por verifyToken.
 */
const selectBranch = async (req, res) => {
    try {
        // req.user viene de verifyTempToken — contiene { id, scope }
        const userId = req.user.id;
        const branchId = parseInt(req.body?.branchId);

        if (!branchId || isNaN(branchId)) {
            return res.status(400).json({ success: false, message: 'branchId requerido' });
        }

        // Validar que ese branchId esté asignado a este usuario Y la sucursal esté activa
        const asignacion = await prisma.usuarioSucursal.findFirst({
            where: { usuarioId: userId, branchId },
            include: { branch: true }
        });

        if (!asignacion || !asignacion.branch?.activa) {
            return res.status(403).json({
                success: false,
                message: 'No tenés acceso a esa sucursal o la sucursal está inactiva'
            });
        }

        // Recuperar datos completos del usuario para armar el payload definitivo
        const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
        if (!usuario) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const payload = {
            id: usuario.id,
            nombre: usuario.nombre,
            esSuperAdmin: usuario.esSuperAdmin,
            esAdmin: usuario.esAdmin,
            permisoFinanzas: usuario.permisoFinanzas,
            permisoTurnos: usuario.permisoTurnos,
            permisoClientes: usuario.permisoClientes,
            permisoPlanes: usuario.permisoPlanes,
            permisoFeriados: usuario.permisoFeriados,
            branchId: asignacion.branchId  // ← la fuente de verdad
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

        return res.status(200).json({
            success: true,
            data: {
                token,
                usuario: payload,
                branch: {
                    id: asignacion.branch.id,
                    nombre: asignacion.branch.nombre
                }
            },
            message: 'Sucursal seleccionada correctamente'
        });

    } catch (error) {
        console.error('Error en selectBranch:', error);
        return res.status(500).json({ success: false, message: 'Error al seleccionar sucursal' });
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
                esSuperAdmin: false, // esSuperAdmin nunca se puede asignar desde la API
                esAdmin: req.user.esSuperAdmin ? (esAdmin || false) : false, // Solo superAdmin puede crear admins
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
            // Solo superAdmin puede promover/degradar a admin
            if (req.user.esSuperAdmin) {
                updateData.esAdmin = esAdmin || false;
            }
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
    selectBranch,
    registrarUsuario,
    getUsuarios,
    editarUsuario,
    eliminarUsuario
};
