const express = require('express');
const { body, validationResult } = require('express-validator');
const Risk = require('../models/Risk');
const Project = require('../models/Project');
const { authenticate, authorize } = require('../middleware/auth');
const { calculateHealthScore, getProjectStatus } = require('../utils/healthScore');
const router = express.Router();

// @route   GET /api/risks
// @desc    Get risks (Employee: own, Admin: all)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    let risks;

    if (req.user.role === 'ADMIN') {
      risks = await Risk.find()
        .populate('project', 'name')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'EMPLOYEE') {
      risks = await Risk.find({ createdBy: req.user._id })
        .populate('project', 'name')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(risks);
  } catch (error) {
    console.error('Get risks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/risks/project/:projectId
// @desc    Get risks for a specific project
// @access  Private
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check access
    if (req.user.role === 'EMPLOYEE' && !project.employees.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const clientId = typeof project.client === 'object' ? project.client._id.toString() : project.client.toString();
    if (req.user.role === 'CLIENT' && clientId !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const risks = await Risk.find({ project: req.params.projectId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(risks);
  } catch (error) {
    console.error('Get project risks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/risks
// @desc    Create risk (Employee only)
// @access  Private (Employee)
router.post('/', authenticate, authorize('EMPLOYEE'), [
  body('project').isMongoId(),
  body('title').notEmpty().trim(),
  body('severity').isIn(['Low', 'Medium', 'High']),
  body('mitigationPlan').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { project, title, severity, mitigationPlan } = req.body;

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

    const risk = new Risk({
      project,
      createdBy: req.user._id,
      title,
      severity,
      mitigationPlan,
      status: 'Open'
    });

    await risk.save();
    await risk.populate('project', 'name');
    await risk.populate('createdBy', 'name email');

    // Update project health score
    const healthScore = await calculateHealthScore(projectDoc);
    const status = getProjectStatus(healthScore);
    projectDoc.healthScore = healthScore;
    projectDoc.status = status;
    await projectDoc.save();

    res.status(201).json(risk);
  } catch (error) {
    console.error('Create risk error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/risks/:id
// @desc    Update risk (Employee: own, Admin: any)
// @access  Private
router.put('/:id', authenticate, [
  body('title').optional().notEmpty().trim(),
  body('severity').optional().isIn(['Low', 'Medium', 'High']),
  body('mitigationPlan').optional().notEmpty().trim(),
  body('status').optional().isIn(['Open', 'Resolved'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const risk = await Risk.findById(req.params.id);
    if (!risk) {
      return res.status(404).json({ error: 'Risk not found' });
    }

    // Check access
    if (req.user.role === 'EMPLOYEE' && risk.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { title, severity, mitigationPlan, status } = req.body;

    if (title) risk.title = title;
    if (severity) risk.severity = severity;
    if (mitigationPlan) risk.mitigationPlan = mitigationPlan;
    if (status) risk.status = status;

    await risk.save();
    await risk.populate('project', 'name');
    await risk.populate('createdBy', 'name email');

    // Update project health score
    const projectDoc = await Project.findById(risk.project);
    if (projectDoc) {
      const healthScore = await calculateHealthScore(projectDoc);
      const projectStatus = getProjectStatus(healthScore);
      projectDoc.healthScore = healthScore;
      projectDoc.status = projectStatus;
      await projectDoc.save();
    }

    res.json(risk);
  } catch (error) {
    console.error('Update risk error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/risks/:id
// @desc    Delete risk (Employee: own, Admin: any)
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const risk = await Risk.findById(req.params.id);
    if (!risk) {
      return res.status(404).json({ error: 'Risk not found' });
    }

    // Check access
    if (req.user.role === 'EMPLOYEE' && risk.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const projectId = risk.project;
    await Risk.findByIdAndDelete(req.params.id);

    // Update project health score
    const projectDoc = await Project.findById(projectId);
    if (projectDoc) {
      const healthScore = await calculateHealthScore(projectDoc);
      const projectStatus = getProjectStatus(healthScore);
      projectDoc.healthScore = healthScore;
      projectDoc.status = projectStatus;
      await projectDoc.save();
    }

    res.json({ message: 'Risk deleted' });
  } catch (error) {
    console.error('Delete risk error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

