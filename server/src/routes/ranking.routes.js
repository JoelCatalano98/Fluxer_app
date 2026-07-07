const { Router } = require('express');
const { getRanking, upsertRecord, getMyRecord } = require('../controllers/ranking.controller.js');

const router = Router();

router.get('/', getRanking);
router.get('/my-record', getMyRecord);
router.post('/', upsertRecord);

module.exports = router;
