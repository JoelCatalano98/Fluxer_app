const express = require('express');
const router = express.Router();
const { login, selectBranch, registrarUsuario, getUsuarios, editarUsuario, eliminarUsuario } = require('../controllers/auth.controller');
const { verifyToken, verifyTempToken, requireAdmin } = require('../middlewares/auth.middleware');

// Public routes
router.post('/login', login);

// Selección de sucursal — protegido por verifyTempToken (scope: branch-selection-only)
// El tempToken viene del login cuando el usuario tiene 2+ sucursales asignadas.
router.post('/select-branch', verifyTempToken, selectBranch);

// Protected routes (admin only)
router.post('/registrar', verifyToken, requireAdmin, registrarUsuario);
router.get('/usuarios', verifyToken, requireAdmin, getUsuarios);
router.put('/usuarios/:id', verifyToken, requireAdmin, editarUsuario);
router.delete('/usuarios/:id', verifyToken, requireAdmin, eliminarUsuario);

module.exports = router;
