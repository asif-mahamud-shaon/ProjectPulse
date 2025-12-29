'use client';

import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminDashboard from '../../../components/admin/AdminDashboard';
import Layout from '../../../components/common/Layout';

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <Layout>
        <AdminDashboard />
      </Layout>
    </ProtectedRoute>
  );
}
