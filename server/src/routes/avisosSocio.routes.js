const express = require('express');
const router = express.Router();
const { getAvisosSocio } = require('../controllers/avisos.controller');

router.get('/', getAvisosSocio);

module.exports = router;
