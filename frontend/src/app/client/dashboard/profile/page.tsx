'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../../../components/common/Layout';
import api from '../../../../lib/api';
import { useAuth } from '../../../../context/AuthContext';
import { User as UserIcon, Mail, Edit, Save } from 'lucide-react';

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
      setUser({ id: user?.id || res.data._id || '', name: res.data.name, email: res.data.email, role: user?.role || 'CLIENT' });
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
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full">
        <div className="px-6 pt-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <UserIcon className="mr-3" size={28} /> My Profile
            </h1>

            {message && <div className="bg-green-100 text-green-800 p-3 rounded-md mb-4 border border-green-300">{message}</div>}
            {error && <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4 border border-red-300">{error}</div>}

            <form onSubmit={handleUpdateProfile}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                  Name
                </label>
                <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
                  <UserIcon size={20} className="text-gray-400 ml-3" />
                  <input
                    type="text"
                    id="name"
                    className="flex-1 p-3 focus:outline-none rounded-r-md"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    readOnly={!isEditing}
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                  Email
                </label>
                <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
                  <Mail size={20} className="text-gray-400 ml-3" />
                  <input
                    type="email"
                    id="email"
                    className="flex-1 p-3 focus:outline-none rounded-r-md"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!isEditing}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                {isEditing ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setName(user.name);
                        setEmail(user.email);
                        setMessage('');
                        setError('');
                      }}
                      className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : <><Save size={18} className="inline mr-2" /> Save Changes</>}
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
                  >
                    <Edit size={18} className="inline mr-2" /> Edit Profile
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
