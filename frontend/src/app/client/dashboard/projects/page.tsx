'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../../../components/common/Layout';
import api from '../../../../lib/api';
import { FolderKanban, Search, Calendar, TrendingUp } from 'lucide-react';

interface Project {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  healthScore: number;
  status: 'On Track' | 'At Risk' | 'Critical';
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <FolderKanban size={32} />
              My Projects
            </h1>
            <p className="text-gray-600 text-base">View all your projects</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-gray-900 placeholder-gray-500 text-base"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="px-6 pb-6">
          {filteredProjects.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <FolderKanban size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600">Try adjusting your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
                      project.status === 'On Track' ? 'bg-gray-100 text-gray-900 border-gray-300' :
                      project.status === 'At Risk' ? 'bg-gray-100 text-gray-900 border-gray-300' :
                      'bg-gray-100 text-gray-900 border-gray-300'
                    }`}>
                      {project.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
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
                        <Calendar size={14} className="text-gray-400" />
                        <span>Started {new Date(project.startDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
