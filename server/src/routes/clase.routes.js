const express = require('express');
const router = express.Router();
const claseController = require('../controllers/clase.controller');

router.get('/', claseController.getClases);
router.post('/', claseController.createClase);

module.exports = router;
