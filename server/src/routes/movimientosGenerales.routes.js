const express = require('express');
const router = express.Router();
const movimientosGeneralesController = require('../controllers/movimientosGenerales.controller');

router.post('/', movimientosGeneralesController.crearMovimientoManual);
router.get('/', movimientosGeneralesController.obtenerMovimientos);

module.exports = router;
