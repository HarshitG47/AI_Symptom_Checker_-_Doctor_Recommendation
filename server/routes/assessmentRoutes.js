const express = require('express');
const router = express.Router();
const {
  createAssessment,
  getAssessments,
  getAssessmentById,
  deleteAssessment,
  chatFollowUp
} = require('../controllers/assessmentController');
const { protect } = require('../middleware/auth');

// All assessment routes are protected
router.use(protect);

router.route('/')
  .post(createAssessment)
  .get(getAssessments);

router.route('/:id')
  .get(getAssessmentById)
  .delete(deleteAssessment);

router.post('/:id/chat', chatFollowUp);

module.exports = router;
