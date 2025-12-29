const express = require('express');
const { body, validationResult } = require('express-validator');
const CheckIn = require('../models/CheckIn');
const Project = require('../models/Project');
const { authenticate, authorize } = require('../middleware/auth');
const { calculateHealthScore, getProjectStatus } = require('../utils/healthScore');
const router = express.Router();

// Helper function to get week start date (Monday)
const getWeekStartDate = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

// @route   GET /api/checkins
// @desc    Get check-ins (Employee: own, Admin: all)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    let checkIns;

    if (req.user.role === 'ADMIN') {
      checkIns = await CheckIn.find()
        .populate('project', 'name')
        .populate('employee', 'name email')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'EMPLOYEE') {
      checkIns = await CheckIn.find({ employee: req.user._id })
        .populate('project', 'name')
        .populate('employee', 'name email')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(checkIns);
  } catch (error) {
    console.error('Get check-ins error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/checkins/project/:projectId
// @desc    Get check-ins for a specific project
// @access  Private
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check access
    const employeeIds = project.employees.map(e => 
      typeof e === 'object' ? e._id.toString() : e.toString()
    );
    if (req.user.role === 'EMPLOYEE' && !employeeIds.includes(req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (req.user.role === 'CLIENT') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const checkIns = await CheckIn.find({ project: req.params.projectId })
      .populate('employee', 'name email')
      .sort({ createdAt: -1 });

    res.json(checkIns);
  } catch (error) {
    console.error('Get project check-ins error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/checkins
// @desc    Create weekly check-in (Employee only, one per week per project)
// @access  Private (Employee)
router.post('/', authenticate, authorize('EMPLOYEE'), [
  body('project').isMongoId(),
  body('progressSummary').notEmpty().trim(),
  body('confidenceLevel').isInt({ min: 1, max: 5 }),
  body('estimatedCompletion').isInt({ min: 0, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { project, progressSummary, blockers, confidenceLevel, estimatedCompletion } = req.body;

    // Verify project exists and employee is assigned
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const employeeIds = projectDoc.employees.map(e => 
      typeof e === 'object' ? e._id.toString() : e.toString()
    );
    if (!employeeIds.includes(req.user._id.toString())) {
      return res.status(403).json({ error: 'You are not assigned to this project' });
    }

    // Check if check-in already exists for this week
    const weekStartDate = getWeekStartDate();
    const existingCheckIn = await CheckIn.findOne({
      project,
      employee: req.user._id,
      weekStartDate
    });

    if (existingCheckIn) {
      return res.status(400).json({ 
        error: 'You have already submitted a check-in for this week' 
      });
    }

    const checkIn = new CheckIn({
      project,
      employee: req.user._id,
      progressSummary,
      blockers: blockers || '',
      confidenceLevel,
      estimatedCompletion,
      weekStartDate
    });

    await checkIn.save();
    await checkIn.populate('project', 'name');
    await checkIn.populate('employee', 'name email');

    // Update project health score
    const healthScore = await calculateHealthScore(projectDoc);
    const status = getProjectStatus(healthScore);
    projectDoc.healthScore = healthScore;
    projectDoc.status = status;
    await projectDoc.save();

    res.status(201).json(checkIn);
  } catch (error) {
    console.error('Create check-in error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

