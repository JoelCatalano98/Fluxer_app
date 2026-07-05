const express = require('express');
const router = express.Router();
const { login, registrarUsuario, getUsuarios } = require('../controllers/auth.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

// Public routes
router.post('/login', login);

// Protected routes (admin only)
router.post('/registrar', verifyToken, requireAdmin, registrarUsuario);
router.get('/usuarios', verifyToken, requireAdmin, getUsuarios);

module.exports = router;
