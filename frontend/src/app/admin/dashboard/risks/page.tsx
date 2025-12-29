'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../../../../components/common/Layout';
import api from '../../../../lib/api';
import { AlertTriangle, Search, Filter, Calendar, FolderKanban, X, User, Clock, FileText } from 'lucide-react';

interface Risk {
  _id: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'Resolved';
  project: {
    _id: string;
    name: string;
  };
  mitigationPlan?: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

export default function RisksPage() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [showRiskDetails, setShowRiskDetails] = useState(false);

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    try {
      const res = await api.get('/risks');
      setRisks(res.data);
    } catch (error) {
      console.error('Error fetching risks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRiskClick = (risk: Risk, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedRisk(risk);
    setShowRiskDetails(true);
    return false;
  };

  const filteredRisks = risks.filter(risk => {
    const matchesSearch = risk.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         risk.project?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'All' || risk.severity === severityFilter;
    const matchesStatus = statusFilter === 'All' || risk.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Resolved':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Risk Management</h1>
            <p className="text-gray-600 text-base">Monitor and manage project risks</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search risks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-gray-900 placeholder-gray-500 text-base"
              />
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-3 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-gray-900 text-base font-medium min-w-[150px]"
            >
              <option value="All">All Severity</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-gray-900 text-base font-medium min-w-[150px]"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Risks Grid */}
        <div className="px-6 pb-6">
          {filteredRisks.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No risks found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRisks.map((risk, index) => (
                <div
                  key={risk._id}
                  onClick={(e) => handleRiskClick(risk, e)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{risk.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <FolderKanban size={16} className="text-gray-400" />
                          <span>{risk.project?.name || 'No project'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getSeverityColor(risk.severity)}`}>
                          {risk.severity}
                        </span>
                        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(risk.status)}`}>
                          {risk.status}
                        </span>
                      </div>
                      {risk.mitigationPlan && (
                        <p className="text-base text-gray-700 line-clamp-3">{risk.mitigationPlan}</p>
                      )}
                      {risk.createdAt && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={16} className="text-gray-400" />
                          <span>{new Date(risk.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Risk Details Modal */}
        <AnimatePresence>
          {showRiskDetails && selectedRisk && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowRiskDetails(false)}
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
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{selectedRisk.title}</h3>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getSeverityColor(selectedRisk.severity)}`}>
                        {selectedRisk.severity} Severity
                      </span>
                      <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(selectedRisk.status)}`}>
                        {selectedRisk.status}
                      </span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowRiskDetails(false)}
                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Project Information */}
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <FolderKanban size={18} />
                      Project Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Project Name</p>
                        <p className="text-base font-semibold text-gray-900">{selectedRisk.project?.name || 'No project'}</p>
                      </div>
                      {selectedRisk.project?._id && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Project ID</p>
                          <p className="text-xs text-gray-700 font-mono">{selectedRisk.project._id}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Risk Metadata */}
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Clock size={18} />
                      Risk Metadata
                    </h4>
                    <div className="space-y-3">
                      {selectedRisk.createdAt && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Created At</p>
                          <p className="text-base font-semibold text-gray-900">
                            {new Date(selectedRisk.createdAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      )}
                      {selectedRisk.updatedAt && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Last Updated</p>
                          <p className="text-base font-semibold text-gray-900">
                            {new Date(selectedRisk.updatedAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      )}
                      {selectedRisk.createdBy && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Reported By</p>
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-400" />
                            <div>
                              <p className="text-base font-semibold text-gray-900">
                                {selectedRisk.createdBy.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {selectedRisk.createdBy.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Risk Description */}
                {selectedRisk.description && (
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FileText size={18} />
                      Description
                    </h4>
                    <p className="text-base text-gray-900 whitespace-pre-wrap">{selectedRisk.description}</p>
                  </div>
                )}

                {/* Mitigation Plan */}
                {selectedRisk.mitigationPlan && (
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <AlertTriangle size={18} />
                      Mitigation Plan
                    </h4>
                    <p className="text-base text-gray-900 whitespace-pre-wrap">{selectedRisk.mitigationPlan}</p>
                  </div>
                )}

                {/* Risk ID */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Risk ID: <span className="font-mono">{selectedRisk._id}</span></p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
