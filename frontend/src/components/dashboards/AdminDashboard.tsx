'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { 
  Plus, 
  Edit, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  Clock,
  Users,
  FolderKanban,
  Shield,
  Archive,
  Download,
  Search,
  BarChart3,
  TrendingUp
} from 'lucide-react';

interface Project {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  client: { _id: string; name: string; email: string };
  employees: Array<{ _id: string; name: string; email: string }>;
  healthScore: number;
  status: 'On Track' | 'At Risk' | 'Critical' | 'Completed' | 'Archived';
  isArchived?: boolean;
  milestones?: Array<{
    _id?: string;
    name: string;
    targetDate: string;
    status: 'Pending' | 'Completed';
  }>;
  adminNotes?: string;
}

interface Risk {
  _id: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'Resolved';
  project: { _id: string; name: string };
}

interface ActivityItem {
  type: string;
  project: string;
  user: string;
  message: string;
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
    opacity: 1,
    transition: {
      duration: 0.5
    }
  }
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    client: '',
    employees: [] as string[],
    milestones: [] as Array<{ name: string; targetDate: string; status: 'Pending' | 'Completed' }>,
    adminNotes: '',
    status: 'On Track' as 'On Track' | 'At Risk' | 'Critical' | 'Completed' | 'Archived'
  });
  const [users, setUsers] = useState<Array<{ _id: string; name: string; email: string; role: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [searchQuery, statusFilter, sortBy, sortOrder]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const [projectsRes, risksRes, activityRes, usersRes] = await Promise.all([
        api.get(`/projects?${params.toString()}`),
        api.get('/risks'),
        api.get('/activity'),
        api.get('/users').catch(() => ({ data: [] }))
      ]);

      setProjects(projectsRes.data.filter((p: Project) => !p.isArchived));
      setRisks(risksRes.data);
      setActivities(activityRes.data);
      if (usersRes.data) setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics');
      setAnalytics(res.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };


  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject._id}`, formData);
      } else {
        await api.post('/projects', formData);
      }
      setShowProjectModal(false);
      setEditingProject(null);
      setFormData({ 
        name: '', 
        description: '', 
        startDate: '', 
        endDate: '', 
        client: '', 
        employees: [],
        milestones: [],
        adminNotes: '',
        status: 'On Track'
      });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error saving project');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      startDate: project.startDate.split('T')[0],
      endDate: project.endDate.split('T')[0],
      client: project.client._id,
      employees: project.employees.map(e => e._id),
      milestones: project.milestones || [],
      adminNotes: project.adminNotes || '',
      status: project.status
    });
    setShowProjectModal(true);
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this project?')) return;
    try {
      await api.put(`/projects/${id}/archive`);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error archiving project');
    }
  };

  const handleExport = async (type: 'projects' | 'risks' | 'checkins') => {
    try {
      const response = await api.get(`/reports/${type}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error exporting data');
    }
  };

  const projectsByStatus = {
    'On Track': projects.filter(p => p.status === 'On Track'),
    'At Risk': projects.filter(p => p.status === 'At Risk'),
    'Critical': projects.filter(p => p.status === 'Critical'),
    'Completed': projects.filter(p => p.status === 'Completed')
  };

  const highSeverityRisks = risks.filter(r => r.severity === 'High' && r.status === 'Open');
  const openRisks = risks.filter(r => r.status === 'Open');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="relative"
        >
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        {/* Stats Cards with Modern Design */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-blue-600 rounded-lg p-6 text-white shadow-sm border border-blue-700"
          >
            <div className="flex items-center justify-between mb-4">
              <FolderKanban size={32} />
              <Activity size={24} className="opacity-70" />
            </div>
            <p className="text-white text-sm font-medium mb-1 opacity-90">Total Projects</p>
            <p className="text-4xl font-bold">{projects.length}</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-green-600 rounded-lg p-6 text-white shadow-sm border border-green-700"
          >
            <div className="flex items-center justify-between mb-4">
              <CheckCircle size={32} />
              <Activity size={24} className="opacity-70" />
            </div>
            <p className="text-white text-sm font-medium mb-1 opacity-90">On Track</p>
            <p className="text-4xl font-bold">{projectsByStatus['On Track'].length}</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-yellow-600 rounded-lg p-6 text-white shadow-sm border border-yellow-700"
          >
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle size={32} />
              <Clock size={24} className="opacity-70" />
            </div>
            <p className="text-white text-sm font-medium mb-1 opacity-90">At Risk</p>
            <p className="text-4xl font-bold">{projectsByStatus['At Risk'].length}</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-red-600 rounded-lg p-6 text-white shadow-sm border border-red-700"
          >
            <div className="flex items-center justify-between mb-4">
              <XCircle size={32} />
              <AlertTriangle size={24} className="opacity-70" />
            </div>
            <p className="text-white text-sm font-medium mb-1 opacity-90">Critical</p>
            <p className="text-4xl font-bold">{projectsByStatus['Critical'].length}</p>
          </motion.div>
        </motion.div>

        {/* High Severity Risks Alert */}
        <AnimatePresence>
          {highSeverityRisks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <div>
                  <p className="text-red-900 font-bold text-lg">
                    {highSeverityRisks.length} High Severity Risk{highSeverityRisks.length > 1 ? 's' : ''} Require Attention
                  </p>
                  <p className="text-red-700 text-sm">Immediate action recommended</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 overflow-hidden"
        >
          <div className="bg-gray-800 text-white p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Projects</h2>
                <p className="text-gray-300 text-sm mt-1">Manage all your projects</p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setShowAnalytics(true); fetchAnalytics(); }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all shadow-lg font-semibold"
                >
                  <BarChart3 size={18} />
                  Analytics
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleExport('projects')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all shadow-lg font-semibold"
                >
                  <Download size={18} />
                  Export
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setEditingProject(null);
                    setFormData({ 
                      name: '', 
                      description: '', 
                      startDate: '', 
                      endDate: '', 
                      client: '', 
                      employees: [],
                      milestones: [],
                      adminNotes: '',
                      status: 'On Track'
                    });
                    setShowProjectModal(true);
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all shadow-lg font-semibold"
                >
                  <Plus size={20} />
                  Create Project
                </motion.button>
              </div>
            </div>
            
            {/* Search, Filter, Sort */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-300" size={18} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/90 rounded-xl border-0 focus:ring-2 focus:ring-white text-gray-900 placeholder-gray-400"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white/90 rounded-xl border-0 focus:ring-2 focus:ring-white text-gray-900"
              >
                <option value="All">All Status</option>
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Critical">Critical</option>
                <option value="Completed">Completed</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white/90 rounded-xl border-0 focus:ring-2 focus:ring-white text-gray-900"
              >
                <option value="createdAt">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="healthScore">Sort by Health</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-4 py-2 bg-white/90 rounded-xl border-0 focus:ring-2 focus:ring-white text-gray-900"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          <div className="p-6">
            {['On Track', 'At Risk', 'Critical', 'Completed'].map((status, statusIndex) => (
              <motion.div
                key={status}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: statusIndex * 0.1 }}
                className="mb-8"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    status === 'On Track' ? 'bg-emerald-500' :
                    status === 'At Risk' ? 'bg-amber-500' : 'bg-red-500'
                  }`}></span>
                  {status} Projects
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectsByStatus[status as keyof typeof projectsByStatus].map((project, index) => (
                    <motion.div
                      key={project._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="group relative bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">{project.name}</h4>
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); handleEdit(project); }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); handleArchive(project._id); }}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Archive Project"
                          >
                            <Archive size={16} />
                          </motion.button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users size={16} />
                          <span>Client: {project.client.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Shield size={16} />
                          <span>{project.employees.length} Employee{project.employees.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700">Health Score</span>
                            <span className={`text-2xl font-bold ${
                              project.healthScore >= 80 ? 'text-emerald-600' :
                              project.healthScore >= 60 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {project.healthScore}
                            </span>
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
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
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Risks and Activity Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risks Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-800 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">All Risks</h2>
                <p className="text-gray-300 text-sm mt-1">{openRisks.length} open risks</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleExport('risks')}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all shadow-lg font-semibold"
              >
                <Download size={16} />
                Export
              </motion.button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {risks.slice(0, 10).map((risk, index) => (
                  <motion.div
                    key={risk._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{risk.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">Project: {risk.project.name}</p>
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
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Activity Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-800 text-white p-6">
              <h2 className="text-2xl font-bold text-white">Activity Timeline</h2>
              <p className="text-gray-300 text-sm mt-1">Recent project activities</p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {activities.slice(0, 20).map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-start gap-4 border-l-4 border-indigo-500 pl-4 py-2"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-bold text-indigo-600">{activity.user}</span> - {activity.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.project} • {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

      {/* Project Modal */}
      <AnimatePresence>
        {showProjectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowProjectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg border border-gray-200"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h3>
              <form onSubmit={handleCreateProject} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Client</label>
                  <select
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  >
                    <option value="">Select Client</option>
                    {users.filter(u => u.role === 'CLIENT').map(user => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Employees</label>
                  <select
                    multiple
                    value={formData.employees}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({ ...formData, employees: selected });
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  >
                    {users.filter(u => u.role === 'EMPLOYEE').map(user => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>
                <div className="flex gap-4 justify-end pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      setShowProjectModal(false);
                      setEditingProject(null);
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
                    {editingProject ? 'Update Project' : 'Create Project'}
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
