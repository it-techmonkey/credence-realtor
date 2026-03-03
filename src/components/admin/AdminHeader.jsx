'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, LayoutDashboard, Mail, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminHeader() {
  const router = useRouter();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const navLink = "text-gray-400 hover:text-primary transition-colors font-medium";
  const navLinkActive = "text-primary";

  return (
    <header className="bg-secondary border-b border-white/10 shadow-lg sticky top-0 z-40 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 font-display font-semibold text-white hover:text-primary transition-colors"
          >
            <LayoutDashboard size={22} className="text-primary" />
            Credence Admin
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/admin/dashboard" className={navLink}>Dashboard</Link>
            <Link href="/admin/enquiries" className={navLink}>Enquiries</Link>
            <Link href="/admin/leads" className={navLink}>Leads</Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </nav>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-primary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col gap-1">
              <Link href="/admin/dashboard" className="px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/10 hover:text-primary transition-colors" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <Link href="/admin/enquiries" className="px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/10 hover:text-primary transition-colors" onClick={() => setMobileOpen(false)}>Enquiries</Link>
              <Link href="/admin/leads" className="px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/10 hover:text-primary transition-colors" onClick={() => setMobileOpen(false)}>Leads</Link>
              <button type="button" onClick={() => { setMobileOpen(false); handleLogout(); }} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-gray-300 hover:bg-white/10 hover:text-red-400 transition-colors">
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
