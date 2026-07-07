const express = require('express');
const router = express.Router();
const rutinaSocioController = require('../controllers/rutinaSocio.controller');

// GET /api/socio/rutinas/:clienteId
router.get('/:clienteId', rutinaSocioController.obtenerRutinasSocio);

// PUT /api/socio/rutinas/ejercicio/:ejercicioId
router.put('/ejercicio/:ejercicioId', rutinaSocioController.actualizarPesoEjercicio);

module.exports = router;
