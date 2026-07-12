'use client';
import { useEffect, useState } from 'react';
import { Users, Heart, DollarSign, Clock, TrendingUp, Megaphone, UserCheck, Activity } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import StatCard from '../../components/StatCard';
import { getDashboardStats } from '../../lib/api';
import { DashboardStats } from '../../types';
import { formatDateTime, formatCurrency, formatNumber } from '../../lib/utils';

const TYPE_COLORS: Record<string, string> = {
  contribution: 'bg-green-100 text-green-700',
  donor: 'bg-blue-100 text-blue-700',
  campaign: 'bg-amber-100 text-amber-700',
  reminder: 'bg-purple-100 text-purple-700',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message || 'Unable to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Dashboard" subtitle="Family Pledge Palestine Support — live operations overview">
      {loading && <div className="card p-10 text-center text-gray-400">Loading dashboard…</div>}
      {error && <div className="card p-10 text-center text-red-600">{error}</div>}
      {!loading && !error && stats && (
      <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Donors" value={formatNumber(stats.total_donors)} icon={Users} color="green" />
        <StatCard label="Active Pledges" value={formatNumber(stats.active_pledges)} icon={Heart} color="green" trend="12%" trendUp />
        <StatCard label="Contributions This Month" value={formatNumber(stats.contributions_this_month)} icon={TrendingUp} color="blue" />
        <StatCard label="Pending Review" value={formatNumber(stats.pending_contributions)} icon={Clock} color="red" />
        <StatCard label="Total Raised (Tracked)" value={formatCurrency(stats.total_raised_tracked)} icon={DollarSign} color="gold" />
        <StatCard label="Active Campaigns" value={stats.active_campaigns} icon={Megaphone} color="purple" />
        <StatCard label="Collectors" value={stats.collectors_count} icon={UserCheck} color="blue" />
        <StatCard label="This Month" value={`${formatNumber(stats.contributions_this_month)} contributions`} icon={Activity} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-primary" /> Recent Activity
          </h2>
          <div className="space-y-3">
            {stats.recent_activity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize flex-shrink-0 ${TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-600'}`}>
                  {item.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-tight">{item.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(item.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: '/contributions?status=submitted', label: `Review ${stats.pending_contributions} Pending Contributions`, color: 'text-amber-700 bg-amber-50 border-amber-200' },
              { href: '/campaigns', label: 'Create Campaign', color: 'text-primary-dark bg-primary-50 border-primary' },
              { href: '/reminders', label: 'Add Reminder', color: 'text-purple-700 bg-purple-50 border-purple-200' },
              { href: '/notifications', label: 'Send Push Notification', color: 'text-blue-700 bg-blue-50 border-blue-200' },
              { href: '/ai-assistant', label: 'Open AI Assistant', color: 'text-gray-700 bg-gray-50 border-gray-200' },
            ].map((action) => (
              <a
                key={action.href}
                href={action.href}
                className={`flex items-center px-4 py-3 rounded-lg border text-sm font-medium transition-opacity hover:opacity-80 ${action.color}`}
              >
                {action.label}
              </a>
            ))}
          </div>

          {/* Gaza Solidarity */}
          <div className="mt-6 p-4 bg-primary-dark rounded-xl text-center">
            <div className="text-white text-2xl font-bold mb-1">{formatCurrency(stats.total_raised_tracked)}</div>
            <div className="text-white/70 text-xs">Total tracked for Family Pledge support</div>
            <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full" style={{ width: `${Math.min((stats.active_pledges / stats.total_donors) * 100, 100)}%` }} />
            </div>
            <div className="text-white/50 text-xs mt-1">
              {formatNumber(stats.active_pledges)} of {formatNumber(stats.total_donors)} donors active
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </AdminLayout>
  );
}
