const Assessment = require('../models/Assessment');
const aiService = require('../services/aiService');
const pdfParse = require('pdf-parse');

// Create new symptom assessment
const createAssessment = async (req, res, next) => {
  try {
    const { 
      age, gender, weight, height, 
      existingConditions, currentMedications, allergies, pregnancyStatus, 
      painLevel, duration, primarySymptoms, secondarySymptoms, symptoms 
    } = req.body;

    if (!age || !gender || !duration || !primarySymptoms || primarySymptoms.length === 0) {
      res.status(400);
      throw new Error('Please fill in all required fields (age, gender, duration, primary symptoms)');
    }

    // Handle multipart form parsing for arrays
    let parsedPrimary = primarySymptoms;
    if (typeof primarySymptoms === 'string') {
      try {
        parsedPrimary = JSON.parse(primarySymptoms);
      } catch (e) {
        parsedPrimary = primarySymptoms.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    let parsedSecondary = secondarySymptoms;
    if (typeof secondarySymptoms === 'string') {
      try {
        parsedSecondary = JSON.parse(secondarySymptoms);
      } catch (e) {
        parsedSecondary = secondarySymptoms.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    // PDF / Text Report Upload Parsing
    let uploadedReportText = '';
    let uploadedReportName = '';

    if (req.file) {
      try {
        uploadedReportName = req.file.originalname;
        if (req.file.mimetype === 'application/pdf') {
          const pdfData = await pdfParse(req.file.buffer);
          uploadedReportText = pdfData.text;
        } else {
          uploadedReportText = req.file.buffer.toString('utf-8');
        }
        console.log(`[File Upload] Successfully parsed ${uploadedReportName} (${uploadedReportText.length} characters)`);
      } catch (fileErr) {
        console.warn('[File Upload] Failed to parse report file:', fileErr.message);
      }
    }

    const patientData = {
      age, gender, weight, height,
      existingConditions, currentMedications, allergies, pregnancyStatus,
      painLevel, duration, 
      primarySymptoms: parsedPrimary, 
      secondarySymptoms: parsedSecondary, 
      symptoms
    };

    // Run the initial consultation greeting & follow-up questions
    const result = await aiService.runConsultationStep(patientData, [], uploadedReportText);

    // Save to Database in 'consulting' status
    const assessment = await Assessment.create({
      user: req.user._id,
      ...patientData,
      status: 'consulting',
      uploadedReportText,
      uploadedReportName,
      ragKeywords: result.ragKeywords || [],
      chatHistory: [
        { role: 'assistant', content: result.message }
      ]
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
        { primarySymptoms: searchRegex },
        { 'aiAnalysis.possibleConditions.condition': searchRegex },
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

    // If still in consultation, advance the Q&A state machine
    if (assessment.status === 'consulting') {
      assessment.chatHistory.push({ role: 'user', content: message });

      const userTurns = assessment.chatHistory.filter(h => h.role === 'user').length;
      const isForceRequest = message.toLowerCase().includes('compile the final diagnostic report') || 
                             message.toLowerCase().includes('diagnose now') || 
                             message.toLowerCase().includes('complete assessment') ||
                             message.toLowerCase().includes('finish consultation');
      
      const forceComplete = userTurns >= 5 || isForceRequest;

      const result = await aiService.runConsultationStep(
        assessment,
        assessment.chatHistory,
        assessment.uploadedReportText,
        forceComplete
      );

      assessment.chatHistory.push({ role: 'assistant', content: result.message });

      // Accumulate RAG keywords across turns, deduplicated
      if (result.ragKeywords && result.ragKeywords.length > 0) {
        const merged = new Set([...(assessment.ragKeywords || []), ...result.ragKeywords]);
        assessment.ragKeywords = [...merged];
      }
      
      if (result.status === 'completed') {
        assessment.status = 'completed';
        assessment.aiAnalysis = result.aiAnalysis;
      }

      await assessment.save();
      return res.status(200).json(assessment);
    }

    // Completed assessment: run standard follow-up Q&A
    // Count only user messages that came AFTER the assessment was completed
    // (The consulting turns are also in chatHistory, so subtract them)
    const totalUserMessages = assessment.chatHistory.filter(h => h.role === 'user').length;
    const FOLLOW_UP_LIMIT = 10;

    if (totalUserMessages >= FOLLOW_UP_LIMIT) {
      return res.status(429).json({
        message: `Follow-up chat limit of ${FOLLOW_UP_LIMIT} messages reached. Please start a new assessment if you have more questions.`
      });
    }

    const aiResponse = await aiService.getChatFollowUp(
      assessment,
      message,
      assessment.chatHistory
    );

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
