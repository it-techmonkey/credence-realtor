'use client';

import { AuthProvider } from '@/context/AuthContext';
import ConditionalLayout from '@/components/ConditionalLayout';

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <ConditionalLayout>{children}</ConditionalLayout>
    </AuthProvider>
  );
}
