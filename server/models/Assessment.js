const mongoose = require('mongoose');

const possibleConditionSchema = new mongoose.Schema({
  condition: { type: String, required: true },
  confidenceScore: { type: Number, required: true },
  matchingSymptoms: { type: [String], default: [] },
  missingSymptoms: { type: [String], default: [] },
  reasoning: { type: String, required: true }
}, { _id: false });

const assessmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // Phase 2 Structured Fields
    age: { type: Number, required: [true, 'Please add age'] },
    gender: { type: String, required: [true, 'Please add gender'] },
    weight: { type: Number }, // in kg
    height: { type: Number }, // in cm
    existingConditions: { type: String, default: '' },
    currentMedications: { type: String, default: '' },
    allergies: { type: String, default: '' },
    pregnancyStatus: { type: String, default: '' },
    painLevel: { type: Number, min: 1, max: 10 },
    duration: { type: String, required: [true, 'Please add symptoms duration'] },
    status: {
      type: String,
      enum: ['consulting', 'completed'],
      default: 'consulting'
    },
    uploadedReportText: {
      type: String,
      default: ''
    },
    uploadedReportName: {
      type: String,
      default: ''
    },
    ragKeywords: {
      type: [String],
      default: []
    },
    
    // Symptoms
    primarySymptoms: {
      type: [String],
      required: [true, 'Please select primary symptoms'],
    },
    secondarySymptoms: {
      type: [String],
      default: [],
    },
    // Text description from user
    symptoms: {
      type: String,
      default: '',
    },

    // AI Output
    aiAnalysis: {
      possibleConditions: {
        type: [possibleConditionSchema],
        default: [],
      },
      redFlagDetected: {
        type: Boolean,
        default: false,
      },
      severityLevel: {
        type: String,
        enum: ['Mild', 'Moderate', 'Severe'],
        default: 'Mild',
      },
      recommendedSpecialty: {
        type: String,
        default: '',
      },
      recommendedSpecialtyExplanation: {
        type: String,
        default: '',
      },
      healthAdvice: {
        type: String,
        default: '',
      },
      sources: {
        type: [String],
        default: [],
      },
      disclaimer: {
        type: String,
        default: 'This assessment is AI-generated and should not be considered a medical diagnosis. Please consult a licensed healthcare professional for proper evaluation and treatment.',
      },
      carePlan: {
        dietSuggestions: { type: [String], default: [] },
        exerciseRecommendations: { type: [String], default: [] },
        hydrationGoals: { type: String, default: '' },
        sleepAdvice: { type: String, default: '' },
        lifestyleImprovements: { type: [String], default: [] },
        followUpTimeline: { type: String, default: '' }
      },
      medicationSafety: {
        duplicateMedications: [
          {
            name: { type: String },
            reason: { type: String }
          }
        ],
        allergyConflicts: [
          {
            name: { type: String },
            conflict: { type: String }
          }
        ],
        drugInteractions: [
          {
            meds: { type: [String] },
            severity: { type: String },
            description: { type: String }
          }
        ],
        highRiskCombinations: [
          {
            meds: { type: [String] },
            warning: { type: String }
          }
        ],
        alerts: { type: [String], default: [] }
      },
      serviceRecommendations: [
        {
          serviceName: { type: String },
          description: { type: String },
          reason: { type: String },
          actionText: { type: String }
        }
      ],
      agentContributions: [
        {
          agentName: { type: String },
          contribution: { type: String }
        }
      ],
      labTrends: [
        {
          biomarker: { type: String },
          value: { type: Number },
          unit: { type: String },
          trend: { type: String }
        }
      ]
    },
    chatHistory: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Assessment', assessmentSchema);
