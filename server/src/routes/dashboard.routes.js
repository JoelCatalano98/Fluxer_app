const express = require('express');
const router = express.Router();
const { getDashboardMetrics } = require('../controllers/dashboard.controller');

router.get('/', getDashboardMetrics);

module.exports = router;
