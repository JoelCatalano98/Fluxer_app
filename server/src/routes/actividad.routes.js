const express = require('express');
const router = express.Router();
const actividadController = require('../controllers/actividad.controller');

router.get('/', actividadController.getActividades);
router.post('/', actividadController.createActividad);

module.exports = router;
