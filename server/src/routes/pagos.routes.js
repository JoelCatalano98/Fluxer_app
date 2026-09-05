const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagos.controller');

router.get('/', pagosController.obtenerPagos);
router.get('/pendientes/count', pagosController.obtenerPagosPendientesCount);
router.post('/', pagosController.registrarPago);
router.patch('/:id/estado', pagosController.cambiarEstadoPago);

module.exports = router;
