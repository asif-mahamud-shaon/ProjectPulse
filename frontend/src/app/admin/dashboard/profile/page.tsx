'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../../../components/common/Layout';
import api from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { User as UserIcon, Mail, Edit, Save, X } from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await api.put('/users/profile', { name, email });
      setUser({ id: user?.id || res.data._id || '', name: res.data.name, email: res.data.email, role: user?.role || 'ADMIN' });
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-900 text-lg font-semibold">Please log in to view your profile.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full">
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600 text-base">Manage your account information</p>
        </div>

        <div className="px-6 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-8 max-w-2xl"
          >
            {/* Profile Header */}
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                <UserIcon size={40} className="text-gray-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-base text-gray-600">{user.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-900 rounded-full text-sm font-semibold border border-gray-300">
                  {user.role}
                </span>
              </div>
            </div>

            {message && (
              <div className="bg-gray-100 border border-gray-300 text-gray-900 p-4 rounded-lg mb-4">
                {message}
              </div>
            )}
            {error && (
              <div className="bg-gray-100 border border-gray-300 text-gray-900 p-4 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    readOnly={!isEditing}
                    required
                    className={`w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-base ${
                      !isEditing ? 'bg-gray-50' : 'bg-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!isEditing}
                    required
                    className={`w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-500 text-base ${
                      !isEditing ? 'bg-gray-50' : 'bg-white'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                {isEditing ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setName(user.name);
                        setEmail(user.email);
                        setMessage('');
                        setError('');
                      }}
                      className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-base"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-base flex items-center gap-2"
                      disabled={loading}
                    >
                      <Save size={18} />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-base flex items-center gap-2"
                  >
                    <Edit size={18} />
                    Edit Profile
                  </motion.button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
