'use client';

import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientDashboard from '../../../components/client/ClientDashboard';
import Layout from '../../../components/common/Layout';

export default function ClientDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['CLIENT']}>
      <Layout>
        <ClientDashboard />
      </Layout>
    </ProtectedRoute>
  );
}
