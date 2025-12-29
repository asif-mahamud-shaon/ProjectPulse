'use client';

import { useState, useEffect } from 'react';
import Layout from '../../../components/common/Layout';
import api from '../../../lib/api';

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
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!analytics) return null;

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Projects</p>
            <p className="text-3xl font-bold text-gray-900">{analytics.summary.totalProjects}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">{analytics.summary.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Avg Health Score</p>
            <p className="text-3xl font-bold text-gray-900">{analytics.averages.healthScore}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Open Risks</p>
            <p className="text-3xl font-bold text-gray-900">
              {analytics.riskSeverity.High + analytics.riskSeverity.Medium + analytics.riskSeverity.Low}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Project Status</h3>
            <div className="space-y-2">
              {Object.entries(analytics.projectStatus).map(([status, count]: [string, any]) => (
                <div key={status} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{status}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Risk Severity</h3>
            <div className="space-y-2">
              {Object.entries(analytics.riskSeverity).map(([severity, count]: [string, any]) => (
                <div key={severity} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{severity}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}



