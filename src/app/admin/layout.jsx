'use client';

import { usePathname } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const isLogin = pathname === '/admin/login' || pathname === '/admin';

  return (
    <div className="min-h-screen bg-gray-50">
      {!isLogin && <AdminHeader />}
      <div className={isLogin ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8'}>
        {children}
      </div>
    </div>
  );
}
