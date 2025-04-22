'use client';

import RequireAuth from '@/components/RequireAuth';
import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardLayout>
        <h1 className="text-2xl font-bold">Welcome to your Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Start by uploading a CSV or editing your settings.
        </p>
      </DashboardLayout>
    </RequireAuth>
  );
}
