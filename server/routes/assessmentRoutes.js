const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max — matches the UI label
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'), false);
    }
  }
});

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
  .post(upload.single('medicalReport'), createAssessment)
  .get(getAssessments);

router.route('/:id')
  .get(getAssessmentById)
  .delete(deleteAssessment);

router.post('/:id/chat', chatFollowUp);

module.exports = router;
