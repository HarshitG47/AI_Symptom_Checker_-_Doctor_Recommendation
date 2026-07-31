const Reminder = require('../models/Reminder');

// Get all reminders for a user
const getReminders = async (req, res, next) => {
  try {
    const reminders = await Reminder.find({ user: req.user._id }).sort({ dueDate: 1 });
    res.status(200).json(reminders);
  } catch (error) {
    next(error);
  }
};

// Create a new reminder
const createReminder = async (req, res, next) => {
  try {
    const { title, type, dueDate, associatedAssessment } = req.body;

    if (!title || !type || !dueDate) {
      res.status(400);
      throw new Error('Please fill in all required fields (title, type, dueDate)');
    }

    const reminder = await Reminder.create({
      user: req.user._id,
      title,
      type,
      dueDate,
      associatedAssessment: associatedAssessment || null,
    });

    res.status(201).json(reminder);
  } catch (error) {
    next(error);
  }
};

// Toggle reminder completion status
const toggleReminderStatus = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      res.status(404);
      throw new Error('Reminder not found');
    }

    // Check ownership
    if (reminder.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    reminder.status = reminder.status === 'pending' ? 'completed' : 'pending';
    await reminder.save();

    res.status(200).json(reminder);
  } catch (error) {
    next(error);
  }
};

// Delete a reminder
const deleteReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      res.status(404);
      throw new Error('Reminder not found');
    }

    // Check ownership
    if (reminder.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    await reminder.deleteOne();
    res.status(200).json({ id: req.params.id, message: 'Reminder deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReminders,
  createReminder,
  toggleReminderStatus,
  deleteReminder,
};
