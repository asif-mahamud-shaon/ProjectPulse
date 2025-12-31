'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { MessageSquare, CheckCircle, AlertTriangle, Star, ArrowUpRight, Calendar, Heart, Flag } from 'lucide-react';

interface Project {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  healthScore: number;
  status: 'On Track' | 'At Risk' | 'Critical';
}

interface Feedback {
  _id: string;
  project: { _id: string; name: string };
  satisfactionRating: number;
  communicationRating: number;
  comments?: string;
  flaggedIssue: boolean;
  createdAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [feedbackData, setFeedbackData] = useState({
    satisfactionRating: 3,
    communicationRating: 3,
    comments: '',
    flaggedIssue: false
  });
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, feedbacksRes] = await Promise.all([
        api.get('/projects'),
        api.get('/feedback')
      ]);

      setProjects(projectsRes.data);
      setFeedbacks(feedbacksRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFeedback) {
        await api.put(`/feedback/${editingFeedback._id}`, feedbackData);
      } else {
        await api.post('/feedback', {
          project: selectedProject,
          ...feedbackData
        });
      }
      setShowFeedbackModal(false);
      setSelectedProject('');
      setEditingFeedback(null);
      setFeedbackData({ satisfactionRating: 3, communicationRating: 3, comments: '', flaggedIssue: false });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error submitting feedback');
    }
  };

  const getWeekStartDate = () => {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const hasFeedbackThisWeek = (projectId: string) => {
    const weekStart = getWeekStartDate();
    return feedbacks.some(f => 
      f.project._id === projectId && 
      new Date(f.createdAt).getTime() >= weekStart.getTime()
    );
  };

  const getLastFeedback = (projectId: string) => {
    return feedbacks
      .filter(f => f.project._id === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  };

  const projectsNeedingFeedback = projects.filter(p => !hasFeedbackThisWeek(p._id));
  const flaggedIssuesCount = feedbacks.filter(f => f.flaggedIssue).length;
  const avgSatisfaction = feedbacks.length > 0
    ? Math.round(feedbacks.reduce((sum, f) => sum + f.satisfactionRating, 0) / feedbacks.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="relative"
        >
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 pt-6 pb-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600 text-base">Overview of your projects and feedback</p>
        </div>

        {/* Key Metrics */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <MessageSquare size={24} className="text-gray-700" />
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">My Projects</p>
            <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
            <p className="text-xs text-gray-500 mt-2">Active projects</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Star size={24} className="text-gray-700" />
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Average Satisfaction</p>
            <p className="text-3xl font-bold text-gray-900">{avgSatisfaction}/5</p>
            <p className="text-xs text-gray-500 mt-2">From feedback</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Flag size={24} className="text-gray-700" />
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Flagged Issues</p>
            <p className="text-3xl font-bold text-gray-900">{flaggedIssuesCount}</p>
            <p className="text-xs text-gray-500 mt-2">Requires attention</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Secondary Stats */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Feedback</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{projectsNeedingFeedback.length}</p>
              </div>
              <MessageSquare size={24} className="text-gray-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{feedbacks.length}</p>
              </div>
              <CheckCircle size={24} className="text-gray-400" />
            </div>
          </motion.div>
        </div>

        {/* Pending Feedback Alert */}
        <AnimatePresence>
          {projectsNeedingFeedback.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border-l-4 border-gray-400 rounded-lg p-5 mb-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="text-gray-700" size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-gray-900">
                    {projectsNeedingFeedback.length} Project{projectsNeedingFeedback.length > 1 ? 's' : ''} Need Your Feedback
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Please submit your weekly feedback</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* My Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden"
        >
          <div className="bg-white border-b border-gray-200 px-6 py-5">
            <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
            <p className="text-gray-600 text-sm mt-1">View and provide feedback on your projects</p>
          </div>
          <div className="p-6">
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 text-base">No projects found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project, index) => {
                  const lastFeedback = getLastFeedback(project._id);
                  const canSubmitFeedback = !hasFeedbackThisWeek(project._id);
                  
                  return (
                    <motion.div
                      key={project._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-gray-700 transition-colors">
                            {project.name}
                          </h4>
                        </div>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold border border-gray-300">
                          {project.status}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Health Score</span>
                            <span className="text-2xl font-bold text-gray-900">{project.healthScore}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${project.healthScore}%` }}
                              transition={{ duration: 0.8, delay: index * 0.1 }}
                              className="h-2 rounded-full bg-gray-600"
                            />
                          </div>
                        </div>

                        {lastFeedback && (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Star size={14} className="text-gray-600" />
                              <span className="text-xs font-semibold text-gray-700">Last Feedback</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Satisfaction: {lastFeedback.satisfactionRating}/5</span>
                              <span className="text-xs text-gray-600">Comm: {lastFeedback.communicationRating}/5</span>
                            </div>
                          </div>
                        )}

                        {project.startDate && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar size={12} />
                            <span>Started {new Date(project.startDate).toLocaleDateString()}</span>
                          </div>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (lastFeedback) {
                              setEditingFeedback(lastFeedback);
                              setFeedbackData({
                                satisfactionRating: lastFeedback.satisfactionRating,
                                communicationRating: lastFeedback.communicationRating,
                                comments: lastFeedback.comments || '',
                                flaggedIssue: lastFeedback.flaggedIssue
                              });
                            } else {
                              setEditingFeedback(null);
                              setFeedbackData({ satisfactionRating: 3, communicationRating: 3, comments: '', flaggedIssue: false });
                            }
                            setSelectedProject(project._id);
                            setShowFeedbackModal(true);
                          }}
                          className="w-full px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-all font-semibold"
                        >
                          {canSubmitFeedback ? 'Submit Feedback' : 'Update Feedback'}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Feedback */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="bg-white border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-bold text-gray-900">Recent Feedback</h2>
            <p className="text-gray-600 text-sm mt-1">{feedbacks.length} total feedback submissions</p>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            {feedbacks.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 text-sm">No feedback submitted yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.slice(0, 15).map((feedback, index) => (
                  <motion.div
                    key={feedback._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm">{feedback.project.name}</h4>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-gray-600" />
                        <span className="text-xs font-semibold text-gray-700">Satisfaction: {feedback.satisfactionRating}/5</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare size={14} className="text-gray-600" />
                        <span className="text-xs font-semibold text-gray-700">Communication: {feedback.communicationRating}/5</span>
                      </div>
                      {feedback.flaggedIssue && (
                        <div className="flex items-center gap-1">
                          <Flag size={14} className="text-red-600" />
                          <span className="text-xs font-semibold text-red-700">Flagged Issue</span>
                        </div>
                      )}
                    </div>
                    {feedback.comments && (
                      <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">{feedback.comments}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowFeedbackModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {editingFeedback ? 'Update Feedback' : 'Submit Weekly Feedback'}
              </h3>
              <form onSubmit={handleSubmitFeedback} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Satisfaction Rating: <span className="text-gray-700 font-bold">{feedbackData.satisfactionRating}/5</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={feedbackData.satisfactionRating}
                    onChange={(e) => setFeedbackData({ ...feedbackData, satisfactionRating: parseInt(e.target.value) })}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 - Poor</span>
                    <span>5 - Excellent</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Communication Rating: <span className="text-gray-700 font-bold">{feedbackData.communicationRating}/5</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={feedbackData.communicationRating}
                    onChange={(e) => setFeedbackData({ ...feedbackData, communicationRating: parseInt(e.target.value) })}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 - Poor</span>
                    <span>5 - Excellent</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Comments</label>
                  <textarea
                    value={feedbackData.comments}
                    onChange={(e) => setFeedbackData({ ...feedbackData, comments: e.target.value })}
                    placeholder="Share your thoughts and feedback..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-base"
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="flaggedIssue"
                    checked={feedbackData.flaggedIssue}
                    onChange={(e) => setFeedbackData({ ...feedbackData, flaggedIssue: e.target.checked })}
                    className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                  />
                  <label htmlFor="flaggedIssue" className="text-sm font-medium text-gray-900">
                    Flag as an issue requiring immediate attention
                  </label>
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setShowFeedbackModal(false);
                      setSelectedProject('');
                      setEditingFeedback(null);
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-semibold text-base"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-base"
                  >
                    {editingFeedback ? 'Update Feedback' : 'Submit Feedback'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
