const express = require('express');
const Project = require('../models/Project');
const CheckIn = require('../models/CheckIn');
const Feedback = require('../models/Feedback');
const Risk = require('../models/Risk');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Helper function to convert to CSV
const convertToCSV = (data, headers) => {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => headers.map(header => {
    const value = row[header] || '';
    return `"${String(value).replace(/"/g, '""')}"`;
  }).join(','));
  return [csvHeaders, ...csvRows].join('\n');
};

// @route   GET /api/reports/projects
// @desc    Export projects as CSV
// @access  Private (Admin)
router.get('/projects', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const projects = await Project.find({ isArchived: false })
      .populate('client', 'name email')
      .populate('employees', 'name email')
      .sort({ createdAt: -1 });

    const csvData = projects.map(p => ({
      'Project Name': p.name,
      'Description': p.description || '',
      'Status': p.status,
      'Health Score': p.healthScore,
      'Start Date': new Date(p.startDate).toLocaleDateString(),
      'End Date': new Date(p.endDate).toLocaleDateString(),
      'Client': p.client.name,
      'Employees': p.employees.map(e => e.name).join('; '),
      'Created At': new Date(p.createdAt).toLocaleString()
    }));

    const csv = convertToCSV(csvData, [
      'Project Name', 'Description', 'Status', 'Health Score',
      'Start Date', 'End Date', 'Client', 'Employees', 'Created At'
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=projects.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/reports/risks
// @desc    Export risks as CSV
// @access  Private (Admin)
router.get('/risks', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const risks = await Risk.find()
      .populate('project', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const csvData = risks.map(r => ({
      'Risk Title': r.title,
      'Project': r.project.name,
      'Severity': r.severity,
      'Status': r.status,
      'Mitigation Plan': r.mitigationPlan,
      'Created By': r.createdBy.name,
      'Created At': new Date(r.createdAt).toLocaleString()
    }));

    const csv = convertToCSV(csvData, [
      'Risk Title', 'Project', 'Severity', 'Status', 'Mitigation Plan', 'Created By', 'Created At'
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=risks.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export risks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/reports/checkins
// @desc    Export check-ins as CSV
// @access  Private (Admin)
router.get('/checkins', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const checkIns = await CheckIn.find()
      .populate('project', 'name')
      .populate('employee', 'name email')
      .sort({ createdAt: -1 });

    const csvData = checkIns.map(c => ({
      'Project': c.project.name,
      'Employee': c.employee.name,
      'Progress Summary': c.progressSummary,
      'Blockers': c.blockers || '',
      'Confidence Level': c.confidenceLevel,
      'Estimated Completion': `${c.estimatedCompletion}%`,
      'Week Start Date': new Date(c.weekStartDate).toLocaleDateString(),
      'Submitted At': new Date(c.createdAt).toLocaleString()
    }));

    const csv = convertToCSV(csvData, [
      'Project', 'Employee', 'Progress Summary', 'Blockers', 'Confidence Level',
      'Estimated Completion', 'Week Start Date', 'Submitted At'
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=checkins.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export check-ins error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


