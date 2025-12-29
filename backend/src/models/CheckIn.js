const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  progressSummary: {
    type: String,
    required: true,
    trim: true
  },
  blockers: {
    type: String,
    trim: true
  },
  confidenceLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  estimatedCompletion: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  weekStartDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Index to ensure one check-in per employee per project per week
checkInSchema.index({ project: 1, employee: 1, weekStartDate: 1 }, { unique: true });

module.exports = mongoose.model('CheckIn', checkInSchema);




