const express = require('express');
const router = express.Router();
const feriadosController = require('../controllers/feriados.controller');

router.get('/', feriadosController.getFeriados);

module.exports = router;
