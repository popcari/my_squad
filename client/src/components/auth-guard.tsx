'use client';

import '@/i18n';

import { useAuth } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from './layout/header';
import { Sidebar } from './layout/sidebar';
import { LoadingSpinner } from './shared/loading-spinner';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.push('/login');
    }
  }, [user, loading, isPublic, router]);

  if (loading) {
    return <LoadingSpinner fullPage label="Authenticating" />;
  }

  if (!user && !isPublic) return null;

  if (isPublic) return <>{children}</>;

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full">
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
      </div>
    </>
  );
}
