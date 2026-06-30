import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'green' | 'gold' | 'blue' | 'red' | 'purple';
}

const COLOR_MAP = {
  green: { bg: 'bg-primary-50', icon: 'bg-primary text-white', value: 'text-primary-dark' },
  gold: { bg: 'bg-amber-50', icon: 'bg-gold text-white', value: 'text-amber-800' },
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-600 text-white', value: 'text-blue-800' },
  red: { bg: 'bg-red-50', icon: 'bg-red-600 text-white', value: 'text-red-800' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-600 text-white', value: 'text-purple-800' },
};

export default function StatCard({ label, value, icon: Icon, trend, trendUp, color = 'green' }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={cn('card p-5', c.bg)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', c.icon)}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className={cn('text-xs font-semibold px-2 py-1 rounded-full',
            trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          )}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div className={cn('text-2xl font-bold', c.value)}>{value}</div>
      <div className="text-sm text-gray-600 mt-1 font-medium">{label}</div>
    </div>
  );
}
