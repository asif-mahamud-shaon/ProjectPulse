'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import ClientDashboard from '../../../components/client/ClientDashboard';
import Layout from '../../../components/common/Layout';

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'CLIENT') {
      router.push('/unauthorized');
    }
  }, [user, router]);

  if (!user || user.role !== 'CLIENT') {
    return null;
  }

  return (
    <ProtectedRoute>
      <Layout>
        <ClientDashboard />
      </Layout>
    </ProtectedRoute>
  );
}


