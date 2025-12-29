'use client';

import ProtectedRoute from '../../../components/ProtectedRoute';
import EmployeeDashboard from '../../../components/employee/EmployeeDashboard';
import Layout from '../../../components/common/Layout';

export default function EmployeeDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['EMPLOYEE']}>
      <Layout>
        <EmployeeDashboard />
      </Layout>
    </ProtectedRoute>
  );
}
