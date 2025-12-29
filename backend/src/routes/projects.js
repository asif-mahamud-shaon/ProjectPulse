const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { calculateHealthScore, getProjectStatus } = require('../utils/healthScore');
const router = express.Router();

// @route   GET /api/projects
// @desc    Get all projects (Admin) or assigned projects (Employee/Client)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, status, sortBy, sortOrder } = req.query;
    let query = { isArchived: false };

    // Role-based filtering
    if (req.user.role === 'EMPLOYEE') {
      query.employees = req.user._id;
    } else if (req.user.role === 'CLIENT') {
      query.client = req.user._id;
    }

    // Status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    // Search by project name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    let projects = await Project.find(query)
      .populate('client', 'name email')
      .populate('employees', 'name email')
      .populate('createdBy', 'name email');

    // Sort
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    if (sortField === 'name') {
      projects.sort((a, b) => (a.name.localeCompare(b.name)) * sortDirection);
    } else if (sortField === 'healthScore') {
      projects.sort((a, b) => (a.healthScore - b.healthScore) * sortDirection);
    } else {
      projects.sort((a, b) => (new Date(a[sortField]) - new Date(b[sortField])) * sortDirection);
    }

    // Calculate health scores for all projects
    for (let project of projects) {
      const healthScore = await calculateHealthScore(project);
      const projectStatus = getProjectStatus(healthScore);
      project.healthScore = healthScore;
      if (project.status !== 'Completed' && project.status !== 'Archived') {
        project.status = projectStatus;
      }
      await project.save();
    }

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get single project
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name email')
      .populate('employees', 'name email')
      .populate('createdBy', 'name email');

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
    const clientId = typeof project.client === 'object' ? project.client._id.toString() : project.client.toString();
    if (req.user.role === 'CLIENT' && clientId !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate and update health score
    const healthScore = await calculateHealthScore(project);
    const status = getProjectStatus(healthScore);
    project.healthScore = healthScore;
    project.status = status;
    await project.save();

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/projects
// @desc    Create project (Admin only)
// @access  Private (Admin)
router.post('/', authenticate, authorize('ADMIN'), [
  body('name').notEmpty().trim(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('client').isMongoId(),
  body('employees').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, startDate, endDate, client, employees } = req.body;

    // Verify client exists and is CLIENT role
    const clientUser = await User.findById(client);
    if (!clientUser || clientUser.role !== 'CLIENT') {
      return res.status(400).json({ error: 'Invalid client' });
    }

    // Verify employees exist and are EMPLOYEE role
    if (employees && employees.length > 0) {
      const employeeUsers = await User.find({ _id: { $in: employees } });
      if (employeeUsers.length !== employees.length || employeeUsers.some(e => e.role !== 'EMPLOYEE')) {
        return res.status(400).json({ error: 'Invalid employees' });
      }
    }

    const project = new Project({
      name,
      description,
      startDate,
      endDate,
      client,
      employees: employees || [],
      milestones: req.body.milestones || [],
      adminNotes: req.body.adminNotes || '',
      createdBy: req.user._id
    });

    await project.save();
    await project.populate('client', 'name email');
    await project.populate('employees', 'name email');

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project (Admin only)
// @access  Private (Admin)
router.put('/:id', authenticate, authorize('ADMIN'), [
  body('name').optional().notEmpty().trim(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { name, description, startDate, endDate, client, employees, milestones, adminNotes, status } = req.body;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (startDate) project.startDate = startDate;
    if (endDate) project.endDate = endDate;
    if (milestones !== undefined) project.milestones = milestones;
    if (adminNotes !== undefined) project.adminNotes = adminNotes;
    if (status && ['On Track', 'At Risk', 'Critical', 'Completed', 'Archived'].includes(status)) {
      project.status = status;
    }

    if (client) {
      const clientUser = await User.findById(client);
      if (!clientUser || clientUser.role !== 'CLIENT') {
        return res.status(400).json({ error: 'Invalid client' });
      }
      project.client = client;
    }

    if (employees !== undefined) {
      if (employees.length > 0) {
        const employeeUsers = await User.find({ _id: { $in: employees } });
        if (employeeUsers.length !== employees.length || employeeUsers.some(e => e.role !== 'EMPLOYEE')) {
          return res.status(400).json({ error: 'Invalid employees' });
        }
      }
      project.employees = employees;
    }

    await project.save();
    await project.populate('client', 'name email');
    await project.populate('employees', 'name email');

    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/projects/:id/archive
// @desc    Archive project (Admin only) - Soft delete
// @access  Private (Admin)
router.put('/:id/archive', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.isArchived = true;
    project.status = 'Archived';
    await project.save();

    res.json({ message: 'Project archived', project });
  } catch (error) {
    console.error('Archive project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/projects/:id/unarchive
// @desc    Unarchive project (Admin only)
// @access  Private (Admin)
router.put('/:id/unarchive', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.isArchived = false;
    // Recalculate status based on health score
    const healthScore = await calculateHealthScore(project);
    project.status = getProjectStatus(healthScore);
    project.healthScore = healthScore;
    await project.save();

    res.json({ message: 'Project unarchived', project });
  } catch (error) {
    console.error('Unarchive project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

