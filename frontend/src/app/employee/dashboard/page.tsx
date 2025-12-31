'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import EmployeeDashboard from '../../../components/employee/EmployeeDashboard';
import Layout from '../../../components/common/Layout';

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'EMPLOYEE') {
      router.push('/unauthorized');
    }
  }, [user, router]);

  if (!user || user.role !== 'EMPLOYEE') {
    return null;
  }

  return (
    <ProtectedRoute>
      <Layout>
        <EmployeeDashboard />
      </Layout>
    </ProtectedRoute>
  );
}


