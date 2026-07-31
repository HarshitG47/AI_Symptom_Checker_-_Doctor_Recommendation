const express = require('express');
const router = express.Router();
const {
  getReminders,
  createReminder,
  toggleReminderStatus,
  deleteReminder,
} = require('../controllers/reminderController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getReminders)
  .post(createReminder);

router.route('/:id')
  .put(toggleReminderStatus)
  .delete(deleteReminder);

module.exports = router;
