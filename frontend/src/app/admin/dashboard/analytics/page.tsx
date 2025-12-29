'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../../../components/common/Layout';
import api from '../../../../lib/api';
import { BarChart3, TrendingUp, Users, FolderKanban, AlertTriangle } from 'lucide-react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics');
      setAnalytics(res.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
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

  if (!analytics) return null;

  const totalOpenRisks = (analytics.riskSeverity?.High || 0) + 
                         (analytics.riskSeverity?.Medium || 0) + 
                         (analytics.riskSeverity?.Low || 0);

  return (
    <Layout>
      <div className="w-full">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600 text-base">Comprehensive insights and metrics</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <FolderKanban size={24} className="text-gray-600" />
              </div>
              <p className="text-base font-semibold text-gray-700 mb-2">Total Projects</p>
              <p className="text-4xl font-bold text-gray-900">{analytics.summary?.totalProjects || 0}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <Users size={24} className="text-gray-600" />
              </div>
              <p className="text-base font-semibold text-gray-700 mb-2">Total Users</p>
              <p className="text-4xl font-bold text-gray-900">{analytics.summary?.totalUsers || 0}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <TrendingUp size={24} className="text-gray-600" />
              </div>
              <p className="text-base font-semibold text-gray-700 mb-2">Avg Health Score</p>
              <p className="text-4xl font-bold text-gray-900">{Math.round(analytics.averages?.healthScore || 0)}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <AlertTriangle size={24} className="text-gray-600" />
              </div>
              <p className="text-base font-semibold text-gray-700 mb-2">Open Risks</p>
              <p className="text-4xl font-bold text-gray-900">{totalOpenRisks}</p>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Project Status</h3>
              <div className="space-y-3">
                {Object.entries(analytics.projectStatus || {}).map(([status, count]: [string, any]) => (
                  <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-base font-semibold text-gray-900">{status}</span>
                    <span className="text-2xl font-bold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Risk Severity</h3>
              <div className="space-y-3">
                {Object.entries(analytics.riskSeverity || {}).map(([severity, count]: [string, any]) => (
                  <div key={severity} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-base font-semibold text-gray-900">{severity}</span>
                    <span className="text-2xl font-bold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
