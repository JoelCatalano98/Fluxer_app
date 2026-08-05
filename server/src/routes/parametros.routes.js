const express = require('express');
const router = express.Router();
const parametrosController = require('../controllers/parametros.controller');

router.get('/', parametrosController.getParametros);
router.put('/:clave', parametrosController.updateParametro);

module.exports = router;
