'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Plus, AlertTriangle, CheckCircle, Clock, Briefcase, Target } from 'lucide-react';

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="relative"
        >
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </motion.div>
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
            className="bg-blue-600 rounded-lg p-6 text-white shadow-sm border border-blue-700"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Briefcase size={32} className="opacity-90" />
                <CheckCircle className="opacity-50" size={24} />
              </div>
              <p className="text-blue-100 text-sm font-medium mb-1">Assigned Projects</p>
              <p className="text-4xl font-bold">{projects.length}</p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-yellow-600 rounded-lg p-6 text-white shadow-sm border border-yellow-700"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Clock size={32} className="opacity-90" />
                <Target className="opacity-50" size={24} />
              </div>
              <p className="text-amber-100 text-sm font-medium mb-1">Pending Check-ins</p>
              <p className="text-4xl font-bold">{pendingCheckIns.length}</p>
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
                <TrendingUp className="opacity-50" size={24} />
              </div>
              <p className="text-red-100 text-sm font-medium mb-1">Open Risks</p>
              <p className="text-4xl font-bold">{openRisksCount}</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Pending Check-ins Alert */}
        <AnimatePresence>
          {pendingCheckIns.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-xl p-4 mb-6 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="text-amber-600" size={24} />
                </div>
                <div>
                  <p className="text-amber-900 font-bold text-lg">
                    {pendingCheckIns.length} Project{pendingCheckIns.length > 1 ? 's' : ''} Missing Weekly Check-in
                  </p>
                  <p className="text-amber-700 text-sm">Please submit your weekly updates</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assigned Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 mb-8 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6">
            <h2 className="text-2xl font-bold text-white">Assigned Projects</h2>
            <p className="text-emerald-100 text-sm mt-1">Your project portfolio</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, index) => (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="group relative bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-5 hover:shadow-2xl transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-900 text-lg group-hover:text-emerald-600 transition-colors">{project.name}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      project.status === 'On Track' ? 'bg-emerald-100 text-emerald-800' :
                      project.status === 'At Risk' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase size={16} />
                      <span>Client: {project.client.name}</span>
                    </div>
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
                    <div className="flex gap-2 mt-4">
                      {!hasCheckInThisWeek(project._id) && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedProject(project._id);
                            setShowCheckInModal(true);
                          }}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg font-semibold"
                        >
                          Submit Check-in
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedProject(project._id);
                          setShowRiskModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg font-semibold"
                      >
                        Add Risk
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Check-ins and Risks Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Check-ins */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6">
              <h2 className="text-2xl font-bold text-white">My Check-ins</h2>
              <p className="text-blue-100 text-sm mt-1">{checkIns.length} total check-ins</p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {checkIns.slice(0, 10).map((checkIn, index) => (
                  <motion.div
                    key={checkIn._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{checkIn.project.name}</h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {new Date(checkIn.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{checkIn.progressSummary}</p>
                    {checkIn.blockers && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                        <p className="text-sm text-red-700 font-medium">⚠️ Blockers: {checkIn.blockers}</p>
                      </div>
                    )}
                    <div className="flex gap-4 text-sm mt-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">
                        Confidence: {checkIn.confidenceLevel}/5
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-semibold">
                        Progress: {checkIn.estimatedCompletion}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Open Risks */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6">
              <h2 className="text-2xl font-bold text-white">Risks</h2>
              <p className="text-red-100 text-sm mt-1">{openRisksCount} open risks</p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {risks.map((risk, index) => (
                  <motion.div
                    key={risk._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{risk.title}</h4>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          risk.severity === 'High' ? 'bg-red-100 text-red-800' :
                          risk.severity === 'Medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {risk.severity}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          risk.status === 'Open' ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {risk.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Project: {risk.project.name}</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mb-3">{risk.mitigationPlan}</p>
                    {risk.status === 'Open' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleUpdateRiskStatus(risk._id, 'Resolved')}
                        className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg font-semibold"
                      >
                        Mark as Resolved
                      </motion.button>
                    )}
                    {risk.status === 'Resolved' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleUpdateRiskStatus(risk._id, 'Open')}
                        className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg font-semibold"
                      >
                        Reopen Risk
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Submit Weekly Check-in</h3>
              <form onSubmit={handleSubmitCheckIn} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Progress Summary</label>
                  <textarea
                    value={checkInData.progressSummary}
                    onChange={(e) => setCheckInData({ ...checkInData, progressSummary: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Blockers / Challenges</label>
                  <textarea
                    value={checkInData.blockers}
                    onChange={(e) => setCheckInData({ ...checkInData, blockers: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confidence Level: <span className="text-blue-600 font-bold">{checkInData.confidenceLevel}/5</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={checkInData.confidenceLevel}
                    onChange={(e) => setCheckInData({ ...checkInData, confidenceLevel: parseInt(e.target.value) })}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estimated Completion: <span className="text-emerald-600 font-bold">{checkInData.estimatedCompletion}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={checkInData.estimatedCompletion}
                    onChange={(e) => setCheckInData({ ...checkInData, estimatedCompletion: parseInt(e.target.value) })}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
                <div className="flex gap-4 justify-end pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      setShowCheckInModal(false);
                      setSelectedProject('');
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg font-semibold"
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Create Risk</h3>
              <form onSubmit={handleSubmitRisk} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Risk Title</label>
                  <input
                    type="text"
                    value={riskData.title}
                    onChange={(e) => setRiskData({ ...riskData, title: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Severity</label>
                  <select
                    value={riskData.severity}
                    onChange={(e) => setRiskData({ ...riskData, severity: e.target.value as 'Low' | 'Medium' | 'High' })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mitigation Plan</label>
                  <textarea
                    value={riskData.mitigationPlan}
                    onChange={(e) => setRiskData({ ...riskData, mitigationPlan: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                    rows={4}
                  />
                </div>
                <div className="flex gap-4 justify-end pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      setShowRiskModal(false);
                      setSelectedProject('');
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
                    Create Risk
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
  );
}
