'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, CreditCard, Megaphone, FolderOpen,
  Heart, BookOpen, UserCheck, Tv, Bell, Bot, Settings, LogOut,
} from 'lucide-react';
import { removeToken } from '../lib/auth';
import { FAMILY_PLEDGE_LOGO_DATA_URI } from '../lib/logo';
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
    <aside className="fixed inset-y-0 left-0 w-60 bg-[#101827] flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 border border-white/20 overflow-hidden">
            <Image
              src={FAMILY_PLEDGE_LOGO_DATA_URI}
              alt="Family Pledge logo"
              width={44}
              height={44}
              className="object-contain"
              unoptimized
            />
          </div>
          <div>
            <div className="text-white font-black text-sm leading-tight tracking-wide">FAMILY PLEDGE</div>
            <div className="text-white/55 text-xs">NAMLEF Admin</div>
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
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                active
                  ? 'bg-white text-primary-dark shadow-sm'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
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
          100% Donation Policy · v1.0
        </div>
      </div>
    </aside>
  );
}
