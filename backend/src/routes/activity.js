const express = require('express');
const CheckIn = require('../models/CheckIn');
const Feedback = require('../models/Feedback');
const Risk = require('../models/Risk');
const Project = require('../models/Project');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Helper to get week start date
const getWeekStartDate = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

// @route   GET /api/activity
// @desc    Get activity timeline (Admin only)
// @access  Private (Admin)
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const activities = [];

    // Get all check-ins
    const checkIns = await CheckIn.find()
      .populate('project', 'name')
      .populate('employee', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    checkIns.forEach(checkIn => {
      if (checkIn.project && checkIn.employee) {
        activities.push({
          type: 'checkin',
          id: checkIn._id,
          project: checkIn.project.name,
          user: checkIn.employee.name,
          message: `Submitted weekly check-in`,
          createdAt: checkIn.createdAt
        });
      }
    });

    // Get all feedback
    const feedbacks = await Feedback.find()
      .populate('project', 'name')
      .populate('client', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    feedbacks.forEach(feedback => {
      if (feedback.project && feedback.client) {
        activities.push({
          type: 'feedback',
          id: feedback._id,
          project: feedback.project.name,
          user: feedback.client.name,
          message: `Submitted client feedback${feedback.flaggedIssue ? ' (Flagged Issue)' : ''}`,
          createdAt: feedback.createdAt
        });
      }
    });

    // Get all risk updates
    const risks = await Risk.find()
      .populate('project', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    risks.forEach(risk => {
      if (risk.project && risk.createdBy) {
        activities.push({
          type: 'risk',
          id: risk._id,
          project: risk.project.name,
          user: risk.createdBy.name,
          message: `${risk.status === 'Open' ? 'Created' : 'Resolved'} risk: ${risk.title} (${risk.severity})`,
          createdAt: risk.createdAt
        });
      }
    });

    // Get project status changes and admin notes updates
    const projects = await Project.find()
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1 })
      .limit(50);

    projects.forEach(project => {
      if (project.createdBy) {
        // Status changes
        activities.push({
          type: 'project',
          id: project._id,
          project: project.name,
          user: project.createdBy.name,
          message: `Project status changed to ${project.status}`,
          createdAt: project.updatedAt
        });

        // Admin notes updates (only if notes exist)
        if (project.adminNotes && project.adminNotes.trim()) {
          activities.push({
            type: 'note',
            id: project._id,
            project: project.name,
            user: project.createdBy.name,
            message: 'Admin notes updated',
            createdAt: project.updatedAt
          });
        }
      }
    });

    // Sort all activities by date
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(activities.slice(0, 100)); // Return top 100 activities
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


