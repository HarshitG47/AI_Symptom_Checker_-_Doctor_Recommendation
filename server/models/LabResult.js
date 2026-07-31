const mongoose = require('mongoose');

const labResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    biomarker: {
      type: String,
      required: true,
      enum: ['blood_sugar', 'hemoglobin', 'vitamin_d', 'cholesterol'],
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    sourceAssessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LabResult', labResultSchema);
