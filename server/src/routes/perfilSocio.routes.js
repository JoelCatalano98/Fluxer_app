const express = require('express');
const router = express.Router();
const { obtenerPerfil, actualizarPerfil, cambiarPassword } = require('../controllers/perfilSocio.controller');

// Obtener datos del perfil del socio
router.get('/:id', obtenerPerfil);

// Actualizar datos personales del socio
router.put('/:id', actualizarPerfil);

// Cambiar contraseña del socio
router.put('/:id/password', cambiarPassword);

module.exports = router;
