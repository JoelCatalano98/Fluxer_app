const express = require('express');
const router = express.Router();
const { registerSocio, loginSocio } = require('../controllers/authSocio.controller');

// Rutas públicas de autenticación para socios (app móvil)
router.post('/register', registerSocio);
router.post('/login', loginSocio);

module.exports = router;
