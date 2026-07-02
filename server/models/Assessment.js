const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    symptoms: {
      type: String,
      required: [true, 'Please add symptoms'],
    },
    age: {
      type: Number,
      required: [true, 'Please add age'],
    },
    gender: {
      type: String,
      required: [true, 'Please add gender'],
    },
    duration: {
      type: String,
      required: [true, 'Please add symptoms duration'],
    },
    existingConditions: {
      type: String,
      default: '',
    },
    aiAnalysis: {
      possibleCondition: {
        type: String,
        required: true,
      },
      explanation: {
        type: String,
        required: true,
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
      disclaimer: {
        type: String,
        default: 'This assessment is AI-generated and is not a medical diagnosis. Please consult a qualified doctor for professional medical advice.',
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
