const express = require('express');
const router = express.Router();
const turnoSocioController = require('../controllers/turnoSocio.controller');

router.get('/disponibles', turnoSocioController.getClasesDisponibles);
router.post('/reservar', turnoSocioController.reservarTurno);
router.delete('/cancelar/:id', turnoSocioController.cancelarTurno);

module.exports = router;
