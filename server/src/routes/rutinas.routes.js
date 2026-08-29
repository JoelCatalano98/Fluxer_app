const express = require('express');
const router = express.Router();
const rutinasController = require('../controllers/rutinas.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Todas las rutas de rutinas están protegidas por JWT
router.use(verifyToken);

// POST /api/rutinas
router.post('/', rutinasController.crearRutina);

// Rutina General (Debe ir antes de rutas con parámetros para evitar conflictos si hubieran, aunque aquí las rutas difieren)
router.get('/general', rutinasController.obtenerRutinaGeneral);
router.post('/general', rutinasController.crearOActualizarRutinaGeneral);

// GET /api/rutinas/cliente/:clienteId
router.get('/cliente/:clienteId', rutinasController.obtenerRutinasPorCliente);

// PUT /api/rutinas/:id
router.put('/:id', rutinasController.actualizarRutina);

// DELETE /api/rutinas/:id
router.delete('/:id', rutinasController.eliminarRutina);

module.exports = router;
