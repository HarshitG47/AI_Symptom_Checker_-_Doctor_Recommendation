const mongoose = require('mongoose');

const possibleConditionSchema = new mongoose.Schema({
  condition: { type: String, required: true },
  confidenceScore: { type: Number, required: true },
  supportingSymptoms: { type: String, required: true }
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
        required: true,
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
        required: true,
      },
      healthAdvice: {
        type: String,
        required: true,
      },
      sources: {
        type: [String],
        default: [],
      },
      disclaimer: {
        type: String,
        default: 'This assessment is AI-generated and should not be considered a medical diagnosis. Please consult a licensed healthcare professional for proper evaluation and treatment.',
      },
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
