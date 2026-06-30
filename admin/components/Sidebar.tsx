'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, CreditCard, Megaphone, FolderOpen,
  Heart, BookOpen, UserCheck, Tv, Bell, Bot, Settings, LogOut,
} from 'lucide-react';
import { removeToken } from '../lib/auth';
import { cn } from '../lib/utils';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/donors', icon: Users, label: 'Donors' },
  { href: '/contributions', icon: CreditCard, label: 'Contributions' },
  { href: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { href: '/projects', icon: FolderOpen, label: 'Projects' },
  { href: '/impact', icon: Heart, label: 'Impact' },
  { href: '/reminders', icon: BookOpen, label: 'Reminders' },
  { href: '/collectors', icon: UserCheck, label: 'Collectors' },
  { href: '/namlef', icon: Tv, label: 'NAMLEF' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/ai-assistant', icon: Bot, label: 'AI Assistant' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    removeToken();
    router.replace('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-primary-dark flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center flex-shrink-0">
            <span className="text-primary-dark font-bold text-sm">FP</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Family Pledge</div>
            <div className="text-white/50 text-xs">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-white/15 text-white'
                  : 'text-white/65 hover:bg-white/8 hover:text-white'
              )}
            >
              <Icon size={17} className="flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/65 hover:bg-white/8 hover:text-white transition-colors w-full"
        >
          <LogOut size={17} />
          Sign Out
        </button>
        <div className="mt-3 px-3 text-white/30 text-xs">
          NAMLEF Gaza Relief · v1.0
        </div>
      </div>
    </aside>
  );
}
