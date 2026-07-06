const express = require('express');
const router = express.Router();
const { login, registrarUsuario, getUsuarios, editarUsuario, eliminarUsuario } = require('../controllers/auth.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

// Public routes
router.post('/login', login);

// Protected routes (admin only)
router.post('/registrar', verifyToken, requireAdmin, registrarUsuario);
router.get('/usuarios', verifyToken, requireAdmin, getUsuarios);
router.put('/usuarios/:id', verifyToken, requireAdmin, editarUsuario);
router.delete('/usuarios/:id', verifyToken, requireAdmin, eliminarUsuario);

module.exports = router;
