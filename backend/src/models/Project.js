const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  healthScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['On Track', 'At Risk', 'Critical', 'Completed', 'Archived'],
    default: 'On Track'
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  milestones: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    targetDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Pending'
    }
  }],
  adminNotes: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);


