const express = require('express');
const router = express.Router();
const libroRutinasController = require('../controllers/libroRutinas.controller');

// GET /api/libro-rutinas
router.get('/', libroRutinasController.obtenerRutinasLibro);

// POST /api/libro-rutinas
router.post('/', libroRutinasController.crearRutinaLibro);

// PUT /api/libro-rutinas/:id
router.put('/:id', libroRutinasController.actualizarRutinaLibro);

// POST /api/libro-rutinas/asignar
router.post('/asignar', libroRutinasController.asignarRutinaLibro);

// GET /api/libro-rutinas/asignaciones
router.get('/asignaciones', libroRutinasController.obtenerAsignaciones);

// PUT /api/libro-rutinas/asignacion/:id/avanzar-fase
router.put('/asignacion/:id/avanzar-fase', libroRutinasController.avanzarFase);

// PUT /api/libro-rutinas/asignacion/:id/completar
router.put('/asignacion/:id/completar', libroRutinasController.completarAsignacion);

// GET /api/libro-rutinas/cliente/:clienteId
router.get('/cliente/:clienteId', libroRutinasController.obtenerRutinaAlumno);

// GET /api/libro-rutinas/asignacion/:id/historial
router.get('/asignacion/:id/historial', libroRutinasController.obtenerHistorialAsignacion);

module.exports = router;
