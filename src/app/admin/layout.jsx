'use client';

import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-secondary">
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
