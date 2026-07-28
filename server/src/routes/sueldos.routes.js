const express = require('express');
const router = express.Router();
const sueldosController = require('../controllers/sueldos.controller');

router.get('/liquidacion', sueldosController.getLiquidacion);

module.exports = router;
