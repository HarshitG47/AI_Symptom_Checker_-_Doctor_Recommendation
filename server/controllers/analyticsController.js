const Assessment = require('../models/Assessment');
const LabResult = require('../models/LabResult');
const Reminder = require('../models/Reminder');

// Get Health Timeline showing all user records chronologically
const getHealthTimeline = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch assessments, lab results, and reminders
    const assessments = await Assessment.find({ user: userId }).sort({ createdAt: -1 });
    const labResults = await LabResult.find({ user: userId }).sort({ date: -1 });
    const reminders = await Reminder.find({ user: userId, status: 'completed' }).sort({ updatedAt: -1 });

    const timeline = [];

    // Format assessments
    assessments.forEach(item => {
      // Completed consultation
      if (item.status === 'completed') {
        timeline.push({
          id: `assess-${item._id}`,
          type: 'assessment',
          title: 'Health Consultation',
          details: `Diagnosed with ${item.aiAnalysis.possibleConditions?.[0]?.condition || 'symptoms evaluation'}.`,
          secondaryDetails: `Recommended Specialty: ${item.aiAnalysis.recommendedSpecialty}`,
          date: item.createdAt,
          refId: item._id,
          severity: item.aiAnalysis.severityLevel,
        });
      } else {
        timeline.push({
          id: `assess-inc-${item._id}`,
          type: 'assessment_incomplete',
          title: 'Incomplete Assessment',
          details: `Started chat for symptoms: ${item.primarySymptoms.join(', ')}.`,
          date: item.createdAt,
          refId: item._id,
          severity: 'Mild',
        });
      }

      // Format report upload if present
      if (item.uploadedReportName) {
        timeline.push({
          id: `report-${item._id}`,
          type: 'report',
          title: 'Report Uploaded',
          details: `Medical file parsed: ${item.uploadedReportName}`,
          date: item.createdAt,
          refId: item._id,
        });
      }
    });

    // Format lab results
    labResults.forEach(item => {
      let displayName = item.biomarker.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      timeline.push({
        id: `lab-${item._id}`,
        type: 'lab_result',
        title: `${displayName} Recorded`,
        details: `Value: ${item.value} ${item.unit}`,
        date: item.date,
        refId: item.sourceAssessment || null,
      });
    });

    // Format completed reminders
    reminders.forEach(item => {
      timeline.push({
        id: `remind-${item._id}`,
        type: 'reminder',
        title: 'Action Item Completed',
        details: item.title,
        date: item.updatedAt,
        refId: item.associatedAssessment || null,
      });
    });

    // Sort by date descending
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json(timeline);
  } catch (error) {
    next(error);
  }
};

// Get lab trends grouped by biomarker for charts
const getLabTrends = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const labResults = await LabResult.find({ user: userId }).sort({ date: 1 });

    // Group by biomarker
    const trends = {
      blood_sugar: [],
      hemoglobin: [],
      vitamin_d: [],
      cholesterol: [],
    };

    labResults.forEach(r => {
      if (trends[r.biomarker]) {
        trends[r.biomarker].push({
          id: r._id,
          value: r.value,
          unit: r.unit,
          date: r.date,
        });
      }
    });

    res.status(200).json(trends);
  } catch (error) {
    next(error);
  }
};

// Get high-level Analytics Summary
const getAnalyticsSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch user profile and completed assessments
    const assessments = await Assessment.find({ user: userId, status: 'completed' });
    const completedReminders = await Reminder.countDocuments({ user: userId, status: 'completed' });
    const pendingReminders = await Reminder.countDocuments({ user: userId, status: 'pending' });

    // 1. Calculate Health Improvement Score (Base 75)
    // Completed reminders increases it. Severe assessments reduce it.
    let baseScore = 75;
    if (completedReminders > 0) {
      baseScore += Math.min(completedReminders * 3, 15); // Max +15 for completed tasks
    }
    if (pendingReminders > 0) {
      baseScore -= Math.min(pendingReminders * 2, 10); // Deduct for outstanding care plan items
    }

    let severeCount = 0;
    assessments.forEach(item => {
      if (item.aiAnalysis.severityLevel === 'Severe') severeCount++;
    });

    baseScore -= severeCount * 10;
    baseScore = Math.max(Math.min(baseScore, 100), 30); // Boundaries: 30 - 100

    // 2. Risk Indicators
    // Search history for words matching high-risk chronic flags
    const riskIndicators = {
      cardiovascular: false,
      diabetes: false,
      respiratory: false,
      hypertension: false,
    };

    const textToScan = [];
    assessments.forEach(item => {
      textToScan.push(item.symptoms.toLowerCase());
      item.primarySymptoms.forEach(s => textToScan.push(s.toLowerCase()));
      item.aiAnalysis.possibleConditions.forEach(c => {
        textToScan.push(c.condition.toLowerCase());
        textToScan.push(c.reasoning.toLowerCase());
      });
    });

    const scanString = textToScan.join(' ');

    if (scanString.includes('heart') || scanString.includes('cardiac') || scanString.includes('arrhythmia') || scanString.includes('chest pain')) {
      riskIndicators.cardiovascular = true;
    }
    if (scanString.includes('diabet') || scanString.includes('sugar') || scanString.includes('glucose') || scanString.includes('hyperglycemia')) {
      riskIndicators.diabetes = true;
    }
    if (scanString.includes('asthma') || scanString.includes('copd') || scanString.includes('breath') || scanString.includes('bronchitis')) {
      riskIndicators.respiratory = true;
    }
    if (scanString.includes('hypertension') || scanString.includes('blood pressure') || scanString.includes('bp')) {
      riskIndicators.hypertension = true;
    }

    res.status(200).json({
      healthImprovementScore: Math.round(baseScore),
      riskIndicators,
      remindersRatio: {
        completed: completedReminders,
        pending: pendingReminders,
      },
      consultationsCount: assessments.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealthTimeline,
  getLabTrends,
  getAnalyticsSummary,
};
