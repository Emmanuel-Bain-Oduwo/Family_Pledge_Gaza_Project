'use client';
import { useEffect, useState } from 'react';
import { getAdminMe } from '../lib/api';
import { Admin } from '../types';
import { getAdminDisplayName, getAdminInitial } from '../lib/adminDisplay';

interface TopbarProps { title: string; subtitle?: string; admin?: Admin | null; }

export default function Topbar({ title, subtitle, admin: adminProp }: TopbarProps) {
  const [admin, setAdmin] = useState<Admin | null>(adminProp ?? null);

  useEffect(() => {
    if (adminProp !== undefined) setAdmin(adminProp);
  }, [adminProp]);

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
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {admin && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">{initial}</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-gray-900">{displayName}</div>
              <div className="text-xs text-gray-500">Admin</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
