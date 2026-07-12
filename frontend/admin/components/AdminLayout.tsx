'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getAdminMe } from '../lib/api';
import { getToken, removeToken } from '../lib/auth';
import { isAdminRole } from '../lib/adminDisplay';
import { Admin } from '../types';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [checking, setChecking] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const verifyAdmin = () => {
      if (!getToken()) {
        router.replace('/login');
        return;
      }

      getAdminMe()
        .then((currentAdmin) => {
          if (!isAdminRole(currentAdmin)) {
            removeToken();
            router.replace('/login');
            return;
          }
          setAdmin(currentAdmin);
        })
        .catch(() => {
          removeToken();
          router.replace('/login');
        })
        .finally(() => setChecking(false));
    };

    verifyAdmin();
    window.addEventListener('admin-profile-updated', verifyAdmin);
    return () => window.removeEventListener('admin-profile-updated', verifyAdmin);
  }, [router]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [drawerOpen]);

  if (checking) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Checking admin access…</div>;
  }

  if (!admin) return null;

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-gray-50">
      <Sidebar mobileOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      {drawerOpen && <button type="button" aria-label="Close admin menu overlay" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setDrawerOpen(false)} />}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-60">
        <Topbar title={title} subtitle={subtitle} admin={admin} onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
