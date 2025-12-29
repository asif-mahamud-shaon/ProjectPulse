'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Plus, AlertTriangle, CheckCircle, Clock, Briefcase, Target, TrendingUp, ArrowUpRight, Calendar } from 'lucide-react';

interface Project {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  client: { _id: string; name: string; email: string };
  healthScore: number;
  status: 'On Track' | 'At Risk' | 'Critical';
}

interface CheckIn {
  _id: string;
  project: { _id: string; name: string };
  progressSummary: string;
  blockers?: string;
  confidenceLevel: number;
  estimatedCompletion: number;
  weekStartDate: string;
  createdAt: string;
}

interface Risk {
  _id: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'Resolved';
  mitigationPlan: string;
  project: { _id: string; name: string };
  createdBy?: { _id: string; name: string };
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
      duration: 0.4
    }
  }
};

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [checkInData, setCheckInData] = useState({
    progressSummary: '',
    blockers: '',
    confidenceLevel: 3,
    estimatedCompletion: 50
  });
  const [riskData, setRiskData] = useState({
    title: '',
    severity: 'Medium' as 'Low' | 'Medium' | 'High',
    mitigationPlan: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, checkInsRes, risksRes] = await Promise.all([
        api.get('/projects'),
        api.get('/checkins'),
        api.get('/risks')
      ]);

      setProjects(projectsRes.data);
      setCheckIns(checkInsRes.data);
      setRisks(risksRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/checkins', {
        project: selectedProject,
        ...checkInData
      });
      setShowCheckInModal(false);
      setSelectedProject('');
      setCheckInData({ progressSummary: '', blockers: '', confidenceLevel: 3, estimatedCompletion: 50 });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error submitting check-in');
    }
  };

  const handleSubmitRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/risks', {
        project: selectedProject,
        ...riskData
      });
      setShowRiskModal(false);
      setSelectedProject('');
      setRiskData({ title: '', severity: 'Medium', mitigationPlan: '' });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating risk');
    }
  };

  const getWeekStartDate = () => {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const hasCheckInThisWeek = (projectId: string) => {
    const weekStart = getWeekStartDate();
    return checkIns.some(ci => 
      ci.project._id === projectId && 
      new Date(ci.weekStartDate).getTime() === weekStart.getTime()
    );
  };

  const pendingCheckIns = projects.filter(p => !hasCheckInThisWeek(p._id));
  const openRisksCount = risks.filter(r => r.status === 'Open').length;
  const avgHealthScore = projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + p.healthScore, 0) / projects.length)
    : 0;

  const handleUpdateRiskStatus = async (riskId: string, newStatus: 'Open' | 'Resolved') => {
    try {
      await api.put(`/risks/${riskId}`, { status: newStatus });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error updating risk status');
    }
  };

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
          <p className="text-gray-600 text-base">Overview of your assigned projects and tasks</p>
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
                <Briefcase size={24} className="text-gray-700" />
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Assigned Projects</p>
            <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
            <p className="text-xs text-gray-500 mt-2">Active assignments</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Clock size={24} className="text-gray-700" />
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Pending Check-ins</p>
            <p className="text-3xl font-bold text-gray-900">{pendingCheckIns.length}</p>
            <p className="text-xs text-gray-500 mt-2">Requires attention</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <AlertTriangle size={24} className="text-gray-700" />
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Open Risks</p>
            <p className="text-3xl font-bold text-gray-900">{openRisksCount}</p>
            <p className="text-xs text-gray-500 mt-2">Active risks</p>
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
                <p className="text-sm font-medium text-gray-600">Average Health Score</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{avgHealthScore}</p>
              </div>
              <TrendingUp size={24} className="text-gray-400" />
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
                <p className="text-sm font-medium text-gray-600">Total Check-ins</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{checkIns.length}</p>
              </div>
              <CheckCircle size={24} className="text-gray-400" />
            </div>
          </motion.div>
        </div>

        {/* Pending Check-ins Alert */}
        <AnimatePresence>
          {pendingCheckIns.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border-l-4 border-gray-400 rounded-lg p-5 mb-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-gray-700" size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-gray-900">
                    {pendingCheckIns.length} Project{pendingCheckIns.length > 1 ? 's' : ''} Missing Weekly Check-in
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Please submit your weekly updates</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assigned Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden"
        >
          <div className="bg-white border-b border-gray-200 px-6 py-5">
            <h2 className="text-2xl font-bold text-gray-900">Assigned Projects</h2>
            <p className="text-gray-600 text-sm mt-1">Your project portfolio and tasks</p>
          </div>
          <div className="p-6">
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 text-base">No projects assigned</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project, index) => (
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
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Briefcase size={14} />
                          <span>{project.client.name}</span>
                        </div>
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

                      {project.startDate && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar size={12} />
                          <span>Started {new Date(project.startDate).toLocaleDateString()}</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        {!hasCheckInThisWeek(project._id) && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedProject(project._id);
                              setShowCheckInModal(true);
                            }}
                            className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-all font-semibold"
                          >
                            Submit Check-in
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedProject(project._id);
                            setShowRiskModal(true);
                          }}
                          className="flex-1 px-4 py-2.5 bg-white text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-all font-semibold border border-gray-300"
                        >
                          Add Risk
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Check-ins and Risks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Check-ins */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="bg-white border-b border-gray-200 px-6 py-5">
              <h2 className="text-xl font-bold text-gray-900">Recent Check-ins</h2>
              <p className="text-gray-600 text-sm mt-1">{checkIns.length} total check-ins</p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {checkIns.length === 0 ? (
                <div className="text-center py-8">
                  <Clock size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600 text-sm">No check-ins yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {checkIns.slice(0, 10).map((checkIn, index) => (
                    <motion.div
                      key={checkIn._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{checkIn.project.name}</h4>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                          {new Date(checkIn.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{checkIn.progressSummary}</p>
                      {checkIn.blockers && (
                        <div className="bg-white border border-gray-200 rounded p-2 mb-2">
                          <p className="text-xs text-gray-700 font-medium">⚠️ Blockers: {checkIn.blockers}</p>
                        </div>
                      )}
                      <div className="flex gap-2 text-xs mt-3">
                        <span className="bg-white text-gray-800 px-2.5 py-1 rounded font-semibold border border-gray-200">
                          Confidence: {checkIn.confidenceLevel}/5
                        </span>
                        <span className="bg-white text-gray-800 px-2.5 py-1 rounded font-semibold border border-gray-200">
                          Progress: {checkIn.estimatedCompletion}%
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Open Risks */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="bg-white border-b border-gray-200 px-6 py-5">
              <h2 className="text-xl font-bold text-gray-900">My Risks</h2>
              <p className="text-gray-600 text-sm mt-1">{openRisksCount} open risks</p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {risks.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600 text-sm">No risks found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {risks.map((risk, index) => (
                    <motion.div
                      key={risk._id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{risk.title}</h4>
                        <div className="flex gap-2">
                          <span className="px-2.5 py-1 bg-gray-200 text-gray-800 rounded text-xs font-semibold">
                            {risk.severity}
                          </span>
                          <span className="px-2.5 py-1 bg-gray-200 text-gray-800 rounded text-xs font-semibold">
                            {risk.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Project: {risk.project.name}</p>
                      <p className="text-sm text-gray-700 bg-white p-2 rounded mb-3 border border-gray-200">{risk.mitigationPlan}</p>
                      {risk.status === 'Open' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUpdateRiskStatus(risk._id, 'Resolved')}
                          className="w-full px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-all font-semibold"
                        >
                          Mark as Resolved
                        </motion.button>
                      )}
                      {risk.status === 'Resolved' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUpdateRiskStatus(risk._id, 'Open')}
                          className="w-full px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-all font-semibold"
                        >
                          Reopen Risk
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Check-in Modal */}
      <AnimatePresence>
        {showCheckInModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCheckInModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Submit Weekly Check-in</h3>
              <form onSubmit={handleSubmitCheckIn} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Progress Summary *</label>
                  <textarea
                    value={checkInData.progressSummary}
                    onChange={(e) => setCheckInData({ ...checkInData, progressSummary: e.target.value })}
                    required
                    placeholder="Describe your progress this week..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-base"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Blockers / Challenges</label>
                  <textarea
                    value={checkInData.blockers}
                    onChange={(e) => setCheckInData({ ...checkInData, blockers: e.target.value })}
                    placeholder="Any blockers or challenges you're facing..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-base"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Confidence Level: <span className="text-gray-700 font-bold">{checkInData.confidenceLevel}/5</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={checkInData.confidenceLevel}
                    onChange={(e) => setCheckInData({ ...checkInData, confidenceLevel: parseInt(e.target.value) })}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Estimated Completion: <span className="text-gray-700 font-bold">{checkInData.estimatedCompletion}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={checkInData.estimatedCompletion}
                    onChange={(e) => setCheckInData({ ...checkInData, estimatedCompletion: parseInt(e.target.value) })}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setShowCheckInModal(false);
                      setSelectedProject('');
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
                    Submit Check-in
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Risk Modal */}
      <AnimatePresence>
        {showRiskModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowRiskModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Create Risk</h3>
              <form onSubmit={handleSubmitRisk} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Risk Title *</label>
                  <input
                    type="text"
                    value={riskData.title}
                    onChange={(e) => setRiskData({ ...riskData, title: e.target.value })}
                    required
                    placeholder="Enter risk title"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Severity *</label>
                  <select
                    value={riskData.severity}
                    onChange={(e) => setRiskData({ ...riskData, severity: e.target.value as 'Low' | 'Medium' | 'High' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-base"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Mitigation Plan *</label>
                  <textarea
                    value={riskData.mitigationPlan}
                    onChange={(e) => setRiskData({ ...riskData, mitigationPlan: e.target.value })}
                    required
                    placeholder="Describe the mitigation plan..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-base"
                    rows={4}
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setShowRiskModal(false);
                      setSelectedProject('');
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
                    Create Risk
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
