'use client';
import { useEffect, useState } from 'react';
import { getAdminMe } from '../lib/api';
import { Admin } from '../types';

interface TopbarProps { title: string; subtitle?: string; }

export default function Topbar({ title, subtitle }: TopbarProps) {
  const [admin, setAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    getAdminMe().then(setAdmin).catch(() => {});
  }, []);

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
              <span className="text-white text-xs font-bold">
                {admin.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-gray-900">{admin.name}</div>
              <div className="text-xs text-gray-500 capitalize">{admin.role.replace('_', ' ')}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
