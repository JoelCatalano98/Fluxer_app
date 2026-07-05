const express = require('express');
const router = express.Router();
const turnosController = require('../controllers/turnos.controller');

// Obtener turnos de la semana (soporta filtros gte/lte)
router.get('/', turnosController.getTurnos);

// Crear una nueva reserva (turno)
router.post('/', turnosController.createTurno);

// Cancelar una reserva por ID
router.delete('/:id', turnosController.deleteTurno);

// Obtener todos los horarios/franjas configuradas
router.get('/horarios', turnosController.getHorarios);

// Configurar una nueva franja horaria
router.post('/horarios', turnosController.createHorario);

// Editar una franja horaria existente
router.put('/horarios/:id', turnosController.updateHorario);

// Dar de baja un horario (baja lógica)
router.delete('/horarios/:id', turnosController.deleteHorario);

module.exports = router;
