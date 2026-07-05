const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracion.controller');

router.get('/', configuracionController.getConfiguracion);
router.put('/', configuracionController.updateConfiguracion);

module.exports = router;
