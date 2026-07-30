const express = require('express');
const router = express.Router();
const sueldosController = require('../controllers/sueldos.controller');

router.get('/', sueldosController.getSueldos);

module.exports = router;
