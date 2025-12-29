'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { MessageSquare, CheckCircle, AlertTriangle, XCircle, Heart, Star, Flag } from 'lucide-react';

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
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-purple-600 rounded-lg p-6 text-white shadow-sm border border-purple-700"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <MessageSquare size={32} className="opacity-90" />
                <CheckCircle className="opacity-50" size={24} />
              </div>
              <p className="text-purple-100 text-sm font-medium mb-1">My Projects</p>
              <p className="text-4xl font-bold">{projects.length}</p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-green-600 rounded-lg p-6 text-white shadow-sm border border-green-700"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle size={32} className="opacity-90" />
                <Star className="opacity-50" size={24} />
              </div>
              <p className="text-emerald-100 text-sm font-medium mb-1">On Track</p>
              <p className="text-4xl font-bold">
                {projects.filter(p => p.status === 'On Track').length}
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-red-600 rounded-lg p-6 text-white shadow-sm border border-red-700"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle size={32} className="opacity-90" />
                <XCircle className="opacity-50" size={24} />
              </div>
              <p className="text-red-100 text-sm font-medium mb-1">At Risk / Critical</p>
              <p className="text-4xl font-bold">
                {projects.filter(p => p.status !== 'On Track').length}
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 overflow-hidden"
        >
          <div className="bg-gray-800 text-white p-6">
            <h2 className="text-2xl font-bold text-white">My Projects</h2>
                <p className="text-gray-300 text-sm mt-1">View and provide feedback on your projects</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, index) => {
                const lastFeedback = getLastFeedback(project._id);
                const canSubmitFeedback = !hasFeedbackThisWeek(project._id);

                return (
                  <motion.div
                    key={project._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="group relative bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-5 hover:shadow-2xl transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-gray-900 text-lg group-hover:text-purple-600 transition-colors">{project.name}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        project.status === 'On Track' ? 'bg-emerald-100 text-emerald-800' :
                        project.status === 'At Risk' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">Health Score</span>
                          <span className={`text-2xl font-bold ${
                            project.healthScore >= 80 ? 'text-emerald-600' :
                            project.healthScore >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {project.healthScore}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${project.healthScore}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            className={`h-2 rounded-full ${
                              project.healthScore >= 80 ? 'bg-emerald-500' :
                              project.healthScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                          />
                        </div>
                      </div>
                      {lastFeedback && (
                        <div className="mt-2 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 mb-2 font-semibold">Last Feedback:</p>
                          <div className="flex gap-3 text-xs">
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-semibold flex items-center gap-1">
                              <Heart size={12} />
                              Satisfaction: {lastFeedback.satisfactionRating}/5
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold flex items-center gap-1">
                              <MessageSquare size={12} />
                              Communication: {lastFeedback.communicationRating}/5
                            </span>
                          </div>
                          {lastFeedback.flaggedIssue && (
                            <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded font-semibold">
                              <Flag size={12} className="inline mr-1" />
                              Issue Flagged
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedProject(project._id);
                          setEditingFeedback(null);
                          setFeedbackData({ satisfactionRating: 3, communicationRating: 3, comments: '', flaggedIssue: false });
                          setShowFeedbackModal(true);
                        }}
                        disabled={!canSubmitFeedback}
                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg ${
                          canSubmitFeedback
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {canSubmitFeedback ? 'Submit Feedback' : 'Feedback Submitted'}
                      </motion.button>
                      {lastFeedback && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedProject(project._id);
                            setEditingFeedback(lastFeedback);
                            setFeedbackData({
                              satisfactionRating: lastFeedback.satisfactionRating,
                              communicationRating: lastFeedback.communicationRating,
                              comments: lastFeedback.comments || '',
                              flaggedIssue: lastFeedback.flaggedIssue
                            });
                            setShowFeedbackModal(true);
                          }}
                          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                        >
                          Edit
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Feedback History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-6">
            <h2 className="text-2xl font-bold text-white">Feedback History</h2>
            <p className="text-pink-100 text-sm mt-1">Your past feedback submissions</p>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {feedbacks.slice(0, 10).map((feedback, index) => (
                <motion.div
                  key={feedback._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-gray-900 text-lg">{feedback.project.name}</h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded">
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-4 mb-3">
                    <div className="flex items-center gap-2 bg-purple-100 px-3 py-2 rounded-lg">
                      <Heart className="text-purple-600" size={16} />
                      <span className="text-sm font-semibold text-purple-800">Satisfaction: {feedback.satisfactionRating}/5</span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded-lg">
                      <MessageSquare className="text-blue-600" size={16} />
                      <span className="text-sm font-semibold text-blue-800">Communication: {feedback.communicationRating}/5</span>
                    </div>
                  </div>
                  {feedback.comments && (
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mb-2">{feedback.comments}</p>
                  )}
                  {feedback.flaggedIssue && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full font-semibold">
                      <Flag size={12} />
                      Issue Flagged
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg border border-gray-200"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {editingFeedback ? 'Edit Feedback' : 'Submit Weekly Feedback'}
              </h3>
              <form onSubmit={handleSubmitFeedback} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Satisfaction Rating: <span className="text-purple-600 font-bold">{feedbackData.satisfactionRating}/5</span>
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        type="button"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setFeedbackData({ ...feedbackData, satisfactionRating: star })}
                        className={`p-2 ${star <= feedbackData.satisfactionRating ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        <Star size={32} className={star <= feedbackData.satisfactionRating ? 'fill-current' : ''} />
                      </motion.button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={feedbackData.satisfactionRating}
                    onChange={(e) => setFeedbackData({ ...feedbackData, satisfactionRating: parseInt(e.target.value) })}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Communication Clarity Rating: <span className="text-blue-600 font-bold">{feedbackData.communicationRating}/5</span>
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        type="button"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setFeedbackData({ ...feedbackData, communicationRating: star })}
                        className={`p-2 ${star <= feedbackData.communicationRating ? 'text-blue-400' : 'text-gray-300'}`}
                      >
                        <Star size={32} className={star <= feedbackData.communicationRating ? 'fill-current' : ''} />
                      </motion.button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={feedbackData.communicationRating}
                    onChange={(e) => setFeedbackData({ ...feedbackData, communicationRating: parseInt(e.target.value) })}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Comments (Optional)</label>
                  <textarea
                    value={feedbackData.comments}
                    onChange={(e) => setFeedbackData({ ...feedbackData, comments: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <input
                    type="checkbox"
                    id="flaggedIssue"
                    checked={feedbackData.flaggedIssue}
                    onChange={(e) => setFeedbackData({ ...feedbackData, flaggedIssue: e.target.checked })}
                    className="w-5 h-5 accent-red-600 cursor-pointer"
                  />
                  <label htmlFor="flaggedIssue" className="text-sm font-semibold text-red-800 cursor-pointer flex items-center gap-2">
                    <Flag size={16} />
                    Flag as Issue
                  </label>
                </div>
                <div className="flex gap-4 justify-end pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      setShowFeedbackModal(false);
                      setSelectedProject('');
                      setEditingFeedback(null);
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
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
