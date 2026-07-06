const express = require('express');
const router = express.Router();
const rutinasController = require('../controllers/rutinas.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Todas las rutas de rutinas están protegidas por JWT
router.use(verifyToken);

// POST /api/rutinas
router.post('/', rutinasController.crearRutina);

// GET /api/rutinas/cliente/:clienteId
router.get('/cliente/:clienteId', rutinasController.obtenerRutinasPorCliente);

// DELETE /api/rutinas/:id
router.delete('/:id', rutinasController.eliminarRutina);

module.exports = router;
