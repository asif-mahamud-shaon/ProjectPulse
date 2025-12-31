const Feedback = require('../models/Feedback');
const CheckIn = require('../models/CheckIn');
const Risk = require('../models/Risk');

/**
 * Calculate project health score (0-100)
 * Based on:
 * 1. Recent client satisfaction ratings (weight: 30%)
 * 2. Recent employee confidence ratings (weight: 20%)
 * 3. Project progress vs timeline (weight: 20%)
 * 4. Number of open risks (weight: 15%)
 * 5. Number of HIGH severity risks (weight: 10%)
 * 6. Flagged client issues (weight: 5%)
 */
const calculateHealthScore = async (project, currentDate = new Date()) => {
  try {
    let score = 100;

    // Get data from last 4 weeks
    const fourWeeksAgo = new Date(currentDate);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    // 1. Recent client satisfaction ratings (30% weight)
    const recentFeedbacks = await Feedback.find({
      project: project._id,
      createdAt: { $gte: fourWeeksAgo }
    }).sort({ createdAt: -1 }).limit(4);

    if (recentFeedbacks.length > 0) {
      const avgSatisfaction = recentFeedbacks.reduce((sum, f) => sum + f.satisfactionRating, 0) / recentFeedbacks.length;
      // Convert 1-5 scale to 0-100, then apply 30% weight
      const satisfactionScore = (avgSatisfaction / 5) * 100;
      score = score * 0.7 + satisfactionScore * 0.3;
    }

    // 2. Recent employee confidence ratings (20% weight)
    const recentCheckIns = await CheckIn.find({
      project: project._id,
      createdAt: { $gte: fourWeeksAgo }
    }).sort({ createdAt: -1 }).limit(4);

    if (recentCheckIns.length > 0) {
      const avgConfidence = recentCheckIns.reduce((sum, c) => sum + c.confidenceLevel, 0) / recentCheckIns.length;
      // Convert 1-5 scale to 0-100, then apply 20% weight
      const confidenceScore = (avgConfidence / 5) * 100;
      score = score * 0.8 + confidenceScore * 0.2;
    }

    // 3. Project progress vs timeline (20% weight)
    const totalDays = Math.ceil((project.endDate - project.startDate) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((currentDate - project.startDate) / (1000 * 60 * 60 * 24));
    const expectedProgress = Math.min(100, (daysElapsed / totalDays) * 100);

    if (recentCheckIns.length > 0) {
      const avgProgress = recentCheckIns.reduce((sum, c) => sum + c.estimatedCompletion, 0) / recentCheckIns.length;
      const progressDiff = avgProgress - expectedProgress;
      // If behind schedule, reduce score
      if (progressDiff < -10) {
        score = score * 0.8 + (100 + progressDiff * 2) * 0.2;
      } else {
        score = score * 0.8 + 100 * 0.2;
      }
    }

    // 4. Number of open risks (15% weight)
    const openRisks = await Risk.countDocuments({
      project: project._id,
      status: 'Open'
    });

    // Each open risk reduces score by 5 points (max reduction: 15 points)
    const riskPenalty = Math.min(15, openRisks * 5);
    score = score * 0.85 + (100 - riskPenalty) * 0.15;

    // 5. Number of HIGH severity risks (10% weight)
    const highRisks = await Risk.countDocuments({
      project: project._id,
      status: 'Open',
      severity: 'High'
    });

    // Each high risk reduces score by 10 points (max reduction: 10 points)
    const highRiskPenalty = Math.min(10, highRisks * 10);
    score = score * 0.9 + (100 - highRiskPenalty) * 0.1;

    // 6. Flagged client issues (5% weight)
    const flaggedIssues = await Feedback.countDocuments({
      project: project._id,
      flaggedIssue: true,
      createdAt: { $gte: fourWeeksAgo }
    });

    // Each flagged issue reduces score by 5 points (max reduction: 5 points)
    const flaggedPenalty = Math.min(5, flaggedIssues * 5);
    score = score * 0.95 + (100 - flaggedPenalty) * 0.05;

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, Math.round(score)));

    return score;
  } catch (error) {
    console.error('Error calculating health score:', error);
    return 50; // Default score if calculation fails
  }
};

/**
 * Determine project status based on health score
 */
const getProjectStatus = (healthScore) => {
  if (healthScore >= 80) return 'On Track';
  if (healthScore >= 60) return 'At Risk';
  return 'Critical';
};

module.exports = { calculateHealthScore, getProjectStatus };



