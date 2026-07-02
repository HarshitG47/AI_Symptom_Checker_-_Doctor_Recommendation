const Assessment = require('../models/Assessment');
const aiService = require('../services/aiService');

// Create new symptom assessment
const createAssessment = async (req, res, next) => {
  try {
    const { symptoms, age, gender, duration, existingConditions } = req.body;

    if (!symptoms || !age || !gender || !duration) {
      res.status(400);
      throw new Error('Please fill in symptoms, age, gender, and duration');
    }

    // Call AI Service
    const aiAnalysis = await aiService.getSymptomCheck(
      symptoms,
      age,
      gender,
      duration,
      existingConditions
    );

    // Save to Database
    const assessment = await Assessment.create({
      user: req.user._id,
      symptoms,
      age,
      gender,
      duration,
      existingConditions: existingConditions || '',
      aiAnalysis,
      chatHistory: []
    });

    res.status(201).json(assessment);
  } catch (error) {
    next(error);
  }
};

// Get all assessments for logged in user (with filtering)
const getAssessments = async (req, res, next) => {
  try {
    const query = { user: req.user._id };

    // Search filter (keyword in symptoms or condition name)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { symptoms: searchRegex },
        { 'aiAnalysis.possibleCondition': searchRegex },
        { 'aiAnalysis.recommendedSpecialty': searchRegex }
      ];
    }

    // Severity filter
    if (req.query.severity) {
      query['aiAnalysis.severityLevel'] = req.query.severity;
    }

    // Date range filter
    if (req.query.dateFilter) {
      const now = new Date();
      let startDate;

      if (req.query.dateFilter === 'today') {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
      } else if (req.query.dateFilter === '7days') {
        startDate = new Date(now.setDate(now.getDate() - 7));
      } else if (req.query.dateFilter === '30days') {
        startDate = new Date(now.setDate(now.getDate() - 30));
      }

      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }

    // Sort by newest first
    const assessments = await Assessment.find(query).sort({ createdAt: -1 });
    res.status(200).json(assessments);
  } catch (error) {
    next(error);
  }
};

// Get single assessment details
const getAssessmentById = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      res.status(404);
      throw new Error('Assessment not found');
    }

    // Check if it belongs to user
    if (assessment.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('User not authorized to view this assessment');
    }

    res.status(200).json(assessment);
  } catch (error) {
    next(error);
  }
};

// Delete assessment
const deleteAssessment = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      res.status(404);
      throw new Error('Assessment not found');
    }

    // Check if it belongs to user
    if (assessment.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('User not authorized to delete this assessment');
    }

    await assessment.deleteOne();
    res.status(200).json({ id: req.params.id, message: 'Assessment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Chat follow up regarding the assessment
const chatFollowUp = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400);
      throw new Error('Please add a message');
    }

    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      res.status(404);
      throw new Error('Assessment not found');
    }

    // Check auth
    if (assessment.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('User not authorized');
    }

    // Call AI Service with full assessment context and current history
    const aiResponse = await aiService.getChatFollowUp(
      assessment,
      message,
      assessment.chatHistory
    );

    // Push conversation to DB
    assessment.chatHistory.push({ role: 'user', content: message });
    assessment.chatHistory.push({ role: 'assistant', content: aiResponse });

    await assessment.save();

    res.status(200).json({
      chatHistory: assessment.chatHistory,
      newMessage: { role: 'assistant', content: aiResponse }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssessment,
  getAssessments,
  getAssessmentById,
  deleteAssessment,
  chatFollowUp
};
