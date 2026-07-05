const express = require('express');
const router = express.Router();
const { getFeriados, createFeriado, deleteFeriado } = require('../controllers/feriados.controller');

router.get('/', getFeriados);
router.post('/', createFeriado);
router.delete('/:id', deleteFeriado);

module.exports = router;
