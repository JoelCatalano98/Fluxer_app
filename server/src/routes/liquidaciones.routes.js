const express = require('express');
const router = express.Router();
const liquidacionesController = require('../controllers/liquidaciones.controller');

router.post('/', liquidacionesController.crearLiquidacion);
router.get('/', liquidacionesController.obtenerLiquidaciones);

module.exports = router;
