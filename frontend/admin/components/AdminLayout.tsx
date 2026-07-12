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

  if (checking) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Checking admin access…</div>;
  }

  if (!admin) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-60">
        <Topbar title={title} subtitle={subtitle} admin={admin} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
