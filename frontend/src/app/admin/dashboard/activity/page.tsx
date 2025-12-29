'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../../../components/common/Layout';
import api from '../../../../lib/api';
import { Activity, Clock, User, FolderKanban } from 'lucide-react';

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activity');
      setActivities(res.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
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

  return (
    <Layout>
      <div className="w-full">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Timeline</h1>
            <p className="text-gray-600 text-base">Track all system activities and events</p>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="px-6 pb-6">
          {activities.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Activity size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-600">Activities will appear here as they occur</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Activity size={20} className="text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User size={16} className="text-gray-400" />
                        <span className="font-semibold text-gray-900">{activity.user}</span>
                      </div>
                      <p className="text-base text-gray-700 mb-2">{activity.message}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {activity.project && (
                          <div className="flex items-center gap-1">
                            <FolderKanban size={14} className="text-gray-400" />
                            <span>{activity.project}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock size={14} className="text-gray-400" />
                          <span>{new Date(activity.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
