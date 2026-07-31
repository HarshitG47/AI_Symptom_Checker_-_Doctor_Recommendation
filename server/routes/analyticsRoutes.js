const express = require('express');
const router = express.Router();
const {
  getHealthTimeline,
  getLabTrends,
  getAnalyticsSummary,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/timeline', getHealthTimeline);
router.get('/trends', getLabTrends);
router.get('/summary', getAnalyticsSummary);

module.exports = router;
