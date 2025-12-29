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
  TrendingUp,
  ArrowUpRight,
  Calendar,
  X
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
      ease: [0, 0, 0.2, 1]
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
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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
      client: project.client?._id || '',
      employees: project.employees?.map(e => e?._id).filter(Boolean) || [],
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
  const totalUsers = users.length;
  const avgHealthScore = projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + p.healthScore, 0) / projects.length)
    : 0;

  const calculateProjectDays = (project: Project) => {
    const today = new Date();
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isCompleted = project.status === 'Completed' || today > endDate;
    
    return {
      totalDays,
      daysElapsed: Math.max(0, daysElapsed),
      daysRemaining: isCompleted ? 0 : Math.max(0, daysRemaining),
      isCompleted,
      progress: isCompleted ? 100 : Math.min(100, Math.round((daysElapsed / totalDays) * 100))
    };
  };

  const handleProjectClick = (project: Project, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      if ('preventDefault' in e) {
        e.preventDefault();
      }
    }
    setSelectedProject(project);
    setShowProjectDetails(true);
    return false;
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Executive Dashboard</h1>
            <p className="text-gray-600 text-base">Comprehensive overview of your project portfolio</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-semibold text-base shadow-sm"
          >
            <Plus size={20} />
            New Project
          </motion.button>
        </div>

        {/* Key Metrics */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FolderKanban size={24} className="text-gray-700" />
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Projects</p>
            <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
            <p className="text-xs text-gray-500 mt-2">Active portfolio</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <CheckCircle size={24} className="text-gray-700" />
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">On Track</p>
            <p className="text-3xl font-bold text-gray-900">{projectsByStatus['On Track'].length}</p>
            <p className="text-xs text-gray-500 mt-2">Healthy projects</p>
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
            <p className="text-sm font-medium text-gray-600 mb-1">At Risk</p>
            <p className="text-3xl font-bold text-gray-900">{projectsByStatus['At Risk'].length}</p>
            <p className="text-xs text-gray-500 mt-2">Requires attention</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <XCircle size={24} className="text-gray-700" />
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Critical</p>
            <p className="text-3xl font-bold text-gray-900">{projectsByStatus['Critical'].length}</p>
            <p className="text-xs text-gray-500 mt-2">Immediate action</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Secondary Stats */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Health</p>
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
                <p className="text-sm font-medium text-gray-600">Open Risks</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{openRisks.length}</p>
              </div>
              <AlertTriangle size={24} className="text-gray-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalUsers}</p>
              </div>
              <Users size={24} className="text-gray-400" />
            </div>
          </motion.div>
        </div>

        {/* High Severity Risks Alert */}
        <AnimatePresence>
          {highSeverityRisks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border-l-4 border-gray-400 rounded-lg p-5 mb-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-gray-700" size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-gray-900">
                    {highSeverityRisks.length} High Severity Risk{highSeverityRisks.length > 1 ? 's' : ''} Require Immediate Attention
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Review and take action on critical risks</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden"
        >
          <div className="bg-white border-b border-gray-200 px-6 py-5">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Project Portfolio</h2>
                <p className="text-gray-600 text-sm mt-1">Manage and monitor all active projects</p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setShowAnalytics(true); fetchAnalytics(); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all border border-gray-300 font-medium text-sm"
                >
                  <BarChart3 size={18} />
                  Analytics
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExport('projects')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all border border-gray-300 font-medium text-sm"
                >
                  <Download size={18} />
                  Export
                </motion.button>
              </div>
            </div>
            
            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-gray-900 placeholder-gray-500 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-gray-900 text-sm font-medium"
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
                className="px-4 py-2.5 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-gray-900 text-sm font-medium"
              >
                <option value="createdAt">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="healthScore">Sort by Health</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-4 py-2.5 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-gray-900 text-sm font-medium"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          <div className="p-6">
            {['On Track', 'At Risk', 'Critical', 'Completed'].map((status, statusIndex) => {
              const statusProjects = projectsByStatus[status as keyof typeof projectsByStatus];
              if (statusProjects.length === 0) return null;
              
              return (
                <motion.div
                  key={status}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: statusIndex * 0.1 }}
                  className="mb-8 last:mb-0"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    <h3 className="text-lg font-bold text-gray-900">{status} Projects</h3>
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                      {statusProjects.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {statusProjects.map((project, index) => (
                      <div
                        key={project._id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleProjectClick(project, e);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all cursor-pointer group"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleProjectClick(project, e as any);
                          }
                        }}
                        style={{ pointerEvents: 'auto' }}
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                        >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-gray-700 transition-colors">
                              {project.name}
                            </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users size={14} />
                          <span>{project.client?.name || 'No client'}</span>
                        </div>
                          </div>
                          <div className="flex gap-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation(); 
                                handleEdit(project); 
                              }}
                              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Edit size={16} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation(); 
                                handleArchive(project._id); 
                              }}
                              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Archive size={16} />
                            </motion.button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Team Size</span>
                            <span className="font-semibold text-gray-900">{project.employees.length} members</span>
                          </div>
                          
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
                        </div>
                        </motion.div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Risks and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risks Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="bg-white border-b border-gray-200 px-6 py-5">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Risk Management</h2>
                  <p className="text-gray-600 text-sm mt-1">{openRisks.length} open risks</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleExport('risks')}
                  className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all border border-gray-300 font-medium text-sm"
                >
                  <Download size={16} />
                  Export
                </motion.button>
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {risks.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600 text-sm">No risks found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {risks.slice(0, 10).map((risk, index) => (
                    <motion.div
                      key={risk._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{risk.title}</h4>
                        <span className="px-2.5 py-1 bg-gray-200 text-gray-800 rounded text-xs font-semibold">
                          {risk.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Project: {risk.project?.name || 'No project'}</p>
                      <span className="inline-block px-2.5 py-1 bg-gray-200 text-gray-800 rounded text-xs font-medium">
                        {risk.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Activity Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="bg-white border-b border-gray-200 px-6 py-5">
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              <p className="text-gray-600 text-sm mt-1">Latest system events and updates</p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600 text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.slice(0, 15).map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Activity size={14} className="text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 mb-1">
                          <span className="font-semibold">{activity.user}</span> {activity.message}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{activity.project}</span>
                          <span>•</span>
                          <span>{new Date(activity.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Project Details Modal */}
      <AnimatePresence>
        {showProjectDetails && selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowProjectDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{selectedProject.name}</h3>
                  <span className="inline-block px-3 py-1.5 bg-gray-100 text-gray-900 rounded-full text-sm font-semibold border border-gray-300">
                    {selectedProject.status}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowProjectDetails(false)}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </motion.button>
              </div>

              {selectedProject.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                  <p className="text-base text-gray-900">{selectedProject.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Project Timeline */}
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Calendar size={18} />
                    Project Timeline
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Start Date</p>
                      <p className="text-base font-semibold text-gray-900">
                        {new Date(selectedProject.startDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">End Date</p>
                      <p className="text-base font-semibold text-gray-900">
                        {new Date(selectedProject.endDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    {(() => {
                      const timeline = calculateProjectDays(selectedProject);
                      return (
                        <>
                          <div className="pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Project Duration</p>
                            <p className="text-base font-semibold text-gray-900">{timeline.totalDays} days</p>
                          </div>
                          {timeline.isCompleted ? (
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Completed</p>
                              <p className="text-base font-semibold text-gray-900">
                                {timeline.daysElapsed} days elapsed
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Days Remaining</p>
                              <p className="text-lg font-bold text-gray-900">{timeline.daysRemaining} days</p>
                            </div>
                          )}
                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-gray-600">Progress</p>
                              <p className="text-sm font-semibold text-gray-900">{timeline.progress}%</p>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${timeline.progress}%` }}
                                className="h-2 rounded-full bg-gray-600"
                              />
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Health Score */}
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <TrendingUp size={18} />
                    Health Metrics
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-600">Health Score</p>
                        <p className="text-3xl font-bold text-gray-900">{selectedProject.healthScore}</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedProject.healthScore}%` }}
                          className="h-3 rounded-full bg-gray-600"
                        />
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-2">Status</p>
                      <span className="inline-block px-3 py-1.5 bg-gray-100 text-gray-900 rounded-full text-sm font-semibold border border-gray-300">
                        {selectedProject.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Users size={18} />
                  Client Information
                </h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Client Name</p>
                    <p className="text-base font-semibold text-gray-900">{selectedProject.client?.name || 'No client'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Email</p>
                    <p className="text-base text-gray-900">{selectedProject.client?.email || 'No email'}</p>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Shield size={18} />
                  Team Members ({selectedProject.employees.length})
                </h4>
                {selectedProject.employees.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedProject.employees.map((employee) => (
                      <div key={employee._id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{employee?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-600">{employee?.email || 'No email'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No employees assigned</p>
                )}
              </div>

              {/* Milestones */}
              {selectedProject.milestones && selectedProject.milestones.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Milestones</h4>
                  <div className="space-y-2">
                    {selectedProject.milestones.map((milestone, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">{milestone.name}</p>
                          <span className={`px-2.5 py-1 rounded text-xs font-medium ${
                            milestone.status === 'Completed' 
                              ? 'bg-gray-100 text-gray-900 border border-gray-300' 
                              : 'bg-gray-100 text-gray-900 border border-gray-300'
                          }`}>
                            {milestone.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Target: {new Date(milestone.targetDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedProject.adminNotes && (
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Admin Notes</h4>
                  <p className="text-base text-gray-900">{selectedProject.adminNotes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowProjectDetails(false);
                    handleEdit(selectedProject);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-base"
                >
                  <Edit size={18} />
                  Edit Project
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowProjectDetails(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-semibold text-base"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Create/Edit Modal */}
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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowProjectModal(false);
                    setEditingProject(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </motion.button>
              </div>
              <form onSubmit={handleCreateProject} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Project Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Enter project name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-base"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter project description"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-base"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Start Date *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">End Date *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Client *</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <select
                        value={formData.client}
                        onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-base appearance-none bg-white"
                      >
                        <option value="">Select Client</option>
                        {users.filter(u => u.role === 'CLIENT').map(user => (
                          <option key={user._id} value={user._id}>{user.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-base"
                    >
                      <option value="On Track">On Track</option>
                      <option value="At Risk">At Risk</option>
                      <option value="Critical">Critical</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Team Members</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 text-gray-400" size={18} />
                      <select
                        multiple
                        value={formData.employees}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value);
                          setFormData({ ...formData, employees: selected });
                        }}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-base min-h-[120px]"
                      >
                        {users.filter(u => u.role === 'EMPLOYEE').map(user => (
                          <option key={user._id} value={user._id}>{user.name}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Hold Ctrl/Cmd to select multiple team members</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Admin Notes</label>
                    <textarea
                      value={formData.adminNotes}
                      onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                      placeholder="Add any internal notes or comments"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-base"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
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
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-semibold text-base"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-base flex items-center gap-2"
                  >
                    <Plus size={18} />
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
