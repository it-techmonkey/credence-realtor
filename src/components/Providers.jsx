'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollButton from '@/components/ScrollButton';
import { AuthProvider } from '@/context/AuthContext';

export default function Providers({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <AuthProvider>
      {isAdmin ? (
        children
      ) : (
        <>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
          <ScrollButton />
        </>
      )}
    </AuthProvider>
  );
}
