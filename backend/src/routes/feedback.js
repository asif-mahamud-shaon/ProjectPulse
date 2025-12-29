const express = require('express');
const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const Project = require('../models/Project');
const { authenticate, authorize } = require('../middleware/auth');
const { calculateHealthScore, getProjectStatus } = require('../utils/healthScore');
const router = express.Router();

// Helper function to get week start date (Monday)
const getWeekStartDate = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

// @route   GET /api/feedback
// @desc    Get feedback (Client: own, Admin: all)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    let feedbacks;

    if (req.user.role === 'ADMIN') {
      feedbacks = await Feedback.find()
        .populate('project', 'name')
        .populate('client', 'name email')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'CLIENT') {
      feedbacks = await Feedback.find({ client: req.user._id })
        .populate('project', 'name')
        .populate('client', 'name email')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(feedbacks);
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/feedback/project/:projectId
// @desc    Get feedback for a specific project
// @access  Private
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check access
    const clientId = typeof project.client === 'object' ? project.client._id.toString() : project.client.toString();
    if (req.user.role === 'CLIENT' && clientId !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const feedbacks = await Feedback.find({ project: req.params.projectId })
      .populate('client', 'name email')
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    console.error('Get project feedback error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/feedback
// @desc    Submit weekly feedback (Client only, one per week per project)
// @access  Private (Client)
router.post('/', authenticate, authorize('CLIENT'), [
  body('project').isMongoId(),
  body('satisfactionRating').isInt({ min: 1, max: 5 }),
  body('communicationRating').isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { project, satisfactionRating, communicationRating, comments, flaggedIssue } = req.body;

    // Verify project exists and client is assigned
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (projectDoc.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You are not assigned to this project' });
    }

    // Check if feedback already exists for this week
    const weekStartDate = getWeekStartDate();
    const existingFeedback = await Feedback.findOne({
      project,
      client: req.user._id,
      weekStartDate
    });

    if (existingFeedback) {
      return res.status(400).json({ 
        error: 'You have already submitted feedback for this week. You can edit it instead.' 
      });
    }

    const feedback = new Feedback({
      project,
      client: req.user._id,
      satisfactionRating,
      communicationRating,
      comments: comments || '',
      flaggedIssue: flaggedIssue || false,
      weekStartDate
    });

    await feedback.save();
    await feedback.populate('project', 'name');
    await feedback.populate('client', 'name email');

    // Update project health score
    const healthScore = await calculateHealthScore(projectDoc);
    const status = getProjectStatus(healthScore);
    projectDoc.healthScore = healthScore;
    if (projectDoc.status !== 'Completed' && projectDoc.status !== 'Archived') {
      projectDoc.status = status;
    }
    await projectDoc.save();

    res.status(201).json(feedback);
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/feedback/:id
// @desc    Update feedback (Client only, within same week)
// @access  Private (Client)
router.put('/:id', authenticate, authorize('CLIENT'), [
  body('satisfactionRating').optional().isInt({ min: 1, max: 5 }),
  body('communicationRating').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // Check ownership
    if (feedback.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if within same week (can only edit current week's feedback)
    const weekStartDate = getWeekStartDate();
    const feedbackWeekStart = new Date(feedback.weekStartDate);
    if (feedbackWeekStart.getTime() !== weekStartDate.getTime()) {
      return res.status(400).json({ 
        error: 'You can only edit feedback from the current week' 
      });
    }

    const { satisfactionRating, communicationRating, comments, flaggedIssue } = req.body;

    if (satisfactionRating !== undefined) feedback.satisfactionRating = satisfactionRating;
    if (communicationRating !== undefined) feedback.communicationRating = communicationRating;
    if (comments !== undefined) feedback.comments = comments;
    if (flaggedIssue !== undefined) feedback.flaggedIssue = flaggedIssue;

    await feedback.save();
    await feedback.populate('project', 'name');
    await feedback.populate('client', 'name email');

    // Update project health score
    const projectDoc = await Project.findById(feedback.project);
    if (projectDoc) {
      const healthScore = await calculateHealthScore(projectDoc);
      const status = getProjectStatus(healthScore);
      projectDoc.healthScore = healthScore;
      if (projectDoc.status !== 'Completed' && projectDoc.status !== 'Archived') {
        projectDoc.status = status;
      }
      await projectDoc.save();
    }

    res.json(feedback);
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

