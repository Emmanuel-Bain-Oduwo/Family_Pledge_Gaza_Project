'use client';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { getAdminMe } from '../lib/api';
import { Admin } from '../types';
import { getAdminDisplayName, getAdminInitial } from '../lib/adminDisplay';

interface TopbarProps { title: string; subtitle?: string; admin?: Admin | null; onMenuClick?: () => void; }

export default function Topbar({ title, subtitle, admin: adminProp, onMenuClick }: TopbarProps) {
  const [admin, setAdmin] = useState<Admin | null>(adminProp ?? null);

  useEffect(() => { if (adminProp !== undefined) setAdmin(adminProp); }, [adminProp]);

  useEffect(() => {
    if (adminProp !== undefined) return;
    const loadAdmin = () => getAdminMe().then(setAdmin).catch(() => setAdmin(null));
    loadAdmin();
    window.addEventListener('admin-profile-updated', loadAdmin);
    return () => window.removeEventListener('admin-profile-updated', loadAdmin);
  }, [adminProp]);

  const displayName = getAdminDisplayName(admin);
  const initial = getAdminInitial(admin);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-3 min-w-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button type="button" onClick={onMenuClick} aria-label="Open admin menu" aria-controls="admin-sidebar" className="lg:hidden inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/40">
          <Menu size={22} />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 break-words">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5 break-words">{subtitle}</p>}
        </div>
      </div>
      {admin && (
        <div className="flex min-w-0 max-w-[45vw] sm:max-w-xs items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0"><span className="text-white text-xs font-bold">{initial}</span></div>
          <div className="hidden sm:block min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{displayName}</div>
            <div className="text-xs text-gray-500 truncate">Admin</div>
          </div>
        </div>
      )}
    </header>
  );
}
