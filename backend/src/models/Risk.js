const mongoose = require('mongoose');

const riskSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true
  },
  mitigationPlan: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Open', 'Resolved'],
    default: 'Open'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Risk', riskSchema);




