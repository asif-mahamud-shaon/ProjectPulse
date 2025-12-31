const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  satisfactionRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  communicationRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comments: {
    type: String,
    trim: true
  },
  flaggedIssue: {
    type: Boolean,
    default: false
  },
  weekStartDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Index to ensure one feedback per client per project per week
feedbackSchema.index({ project: 1, client: 1, weekStartDate: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);



