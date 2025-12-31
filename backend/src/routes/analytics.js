const express = require('express');
const Project = require('../models/Project');
const CheckIn = require('../models/CheckIn');
const Feedback = require('../models/Feedback');
const Risk = require('../models/Risk');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/analytics
// @desc    Get system-wide analytics (Admin only)
// @access  Private (Admin)
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const projects = await Project.find({ isArchived: false });
    const checkIns = await CheckIn.find();
    const feedbacks = await Feedback.find();
    const risks = await Risk.find();
    const users = await User.find();

    // Project status distribution
    const statusDistribution = {
      'On Track': projects.filter(p => p.status === 'On Track').length,
      'At Risk': projects.filter(p => p.status === 'At Risk').length,
      'Critical': projects.filter(p => p.status === 'Critical').length,
      'Completed': projects.filter(p => p.status === 'Completed').length,
      'Archived': projects.filter(p => p.isArchived).length
    };

    // Risk severity distribution
    const riskSeverityDistribution = {
      'High': risks.filter(r => r.severity === 'High' && r.status === 'Open').length,
      'Medium': risks.filter(r => r.severity === 'Medium' && r.status === 'Open').length,
      'Low': risks.filter(r => r.severity === 'Low' && r.status === 'Open').length
    };

    // Average health score
    const avgHealthScore = projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.healthScore, 0) / projects.length)
      : 0;

    // Total users by role
    const usersByRole = {
      'ADMIN': users.filter(u => u.role === 'ADMIN').length,
      'EMPLOYEE': users.filter(u => u.role === 'EMPLOYEE').length,
      'CLIENT': users.filter(u => u.role === 'CLIENT').length
    };

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCheckIns = await CheckIn.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const recentFeedbacks = await Feedback.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const recentRisks = await Risk.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Average satisfaction and communication ratings
    const avgSatisfaction = feedbacks.length > 0
      ? parseFloat((feedbacks.reduce((sum, f) => sum + f.satisfactionRating, 0) / feedbacks.length).toFixed(2))
      : 0;

    const avgCommunication = feedbacks.length > 0
      ? parseFloat((feedbacks.reduce((sum, f) => sum + f.communicationRating, 0) / feedbacks.length).toFixed(2))
      : 0;

    res.json({
      summary: {
        totalProjects: projects.length,
        totalUsers: users.length,
        totalCheckIns: checkIns.length,
        totalFeedbacks: feedbacks.length,
        totalRisks: risks.length
      },
      projectStatus: statusDistribution,
      riskSeverity: riskSeverityDistribution,
      averages: {
        healthScore: avgHealthScore,
        satisfactionRating: avgSatisfaction,
        communicationRating: avgCommunication
      },
      usersByRole,
      recentActivity: {
        checkIns: recentCheckIns,
        feedbacks: recentFeedbacks,
        risks: recentRisks
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


