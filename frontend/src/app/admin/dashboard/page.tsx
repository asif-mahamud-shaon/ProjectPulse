'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import AdminDashboard from '../../../components/admin/AdminDashboard';
import Layout from '../../../components/common/Layout';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/unauthorized');
    }
  }, [user, router]);

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <ProtectedRoute>
      <Layout>
        <AdminDashboard />
      </Layout>
    </ProtectedRoute>
  );
}


