'use client';
import { useEffect, useState } from 'react';
import { Users, Heart, DollarSign, Clock, TrendingUp, Megaphone, Activity, CheckCircle2, XCircle, Smartphone } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import StatCard from '../../components/StatCard';
import { getDashboardStats } from '../../lib/api';
import { DashboardStats } from '../../types';
import { formatDateTime, formatCurrency, formatNumber } from '../../lib/utils';

const TYPE_COLORS: Record<string, string> = { contribution:'bg-green-100 text-green-700',donor:'bg-blue-100 text-blue-700',campaign:'bg-amber-100 text-amber-700',reminder:'bg-purple-100 text-purple-700',payment:'bg-emerald-100 text-emerald-700' };

type ExtendedDashboardStats=DashboardStats&{
  paid_donors_this_month:number;
  successful_payments_this_month:number;
  pending_payments:number;
  failed_payments:number;
  mpesa_settled_kes:number;
  top_contributors:Array<{user_id:string;name:string;total_usd:number;contribution_count:number}>;
};

export default function DashboardPage() {
  const[stats,setStats]=useState<ExtendedDashboardStats|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState<string|null>(null);
  useEffect(()=>{getDashboardStats().then((value)=>setStats(value as ExtendedDashboardStats)).catch(e=>setError(e.message||'Unable to load dashboard data.')).finally(()=>setLoading(false));},[]);
  return <AdminLayout title="Dashboard" subtitle="Family Pledge Palestine Support — live payment and donor overview">
    {loading&&<div className="card p-10 text-center text-gray-400">Loading dashboard…</div>}{error&&<div className="card p-10 text-center text-red-600">{error}</div>}{!loading&&!error&&stats&&<>
      <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-black text-gray-900">M-PESA is provider-confirmed</div><div className="text-sm text-gray-500">Payments update the donor ledger automatically. Open Payments & Contributions for receipts, processing states and failures.</div></div><a href="/contributions" className="btn-primary text-center">Open Payments & Contributions</a></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Donors" value={formatNumber(stats.total_donors)} icon={Users} color="green"/>
        <StatCard label="Active Pledges" value={formatNumber(stats.active_pledges)} icon={Heart} color="green"/>
        <StatCard label="Paid Donors This Month" value={formatNumber(stats.paid_donors_this_month)} icon={CheckCircle2} color="green"/>
        <StatCard label="Successful Payments This Month" value={formatNumber(stats.successful_payments_this_month)} icon={TrendingUp} color="blue"/>
        <StatCard label="Payments Processing" value={formatNumber(stats.pending_payments)} icon={Clock} color="blue"/>
        <StatCard label="Failed / Cancelled This Month" value={formatNumber(stats.failed_payments)} icon={XCircle} color="red"/>
        <StatCard label="Total Raised (USD Ledger)" value={formatCurrency(stats.total_raised_tracked)} icon={DollarSign} color="gold"/>
        <StatCard label="M-PESA Settled" value={`KES ${Number(stats.mpesa_settled_kes||0).toLocaleString()}`} icon={Smartphone} color="green"/>
        <StatCard label="Active Campaigns" value={stats.active_campaigns} icon={Megaphone} color="purple"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5"><h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Activity size={18} className="text-primary"/>Recent Activity</h2><div className="space-y-3">{(stats.recent_activity||[]).map(item=><div key={item.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0"><span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize flex-shrink-0 ${TYPE_COLORS[item.type]||'bg-gray-100 text-gray-600'}`}>{item.type}</span><div className="flex-1 min-w-0"><p className="text-sm text-gray-700 leading-tight">{item.message}</p><p className="text-xs text-gray-400 mt-0.5">{formatDateTime(item.timestamp)}</p></div></div>)}</div></div>
        <div className="card p-5"><h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2><div className="space-y-2">{[
          {href:'/contributions',label:'Payments & Contributions',color:'text-primary-dark bg-primary-50 border-primary'},
          {href:'/operations',label:'Today’s Operations & Follow-ups',color:'text-primary-dark bg-primary-50 border-primary'},
          {href:'/donors?segment=confirmed_this_month',label:`View ${stats.paid_donors_this_month} Paid Donors`,color:'text-green-700 bg-green-50 border-green-200'},
          {href:'/campaigns',label:'Campaign Studio',color:'text-primary-dark bg-primary-50 border-primary'},
          {href:'/ai/chat',label:'Ask Family Pledge AI',color:'text-gray-700 bg-gray-50 border-gray-200'},
        ].map(action=><a key={action.href+action.label} href={action.href} className={`flex items-center px-4 py-3 rounded-lg border text-sm font-medium transition-opacity hover:opacity-80 ${action.color}`}>{action.label}</a>)}</div><div className="mt-6 p-4 bg-primary-dark rounded-xl text-center"><div className="text-white text-2xl font-bold mb-1">{formatCurrency(stats.total_raised_tracked)}</div><div className="text-white/70 text-xs">Confirmed Family Pledge contribution ledger</div><div className="mt-2 text-white/60 text-sm font-bold">KES {Number(stats.mpesa_settled_kes||0).toLocaleString()}</div><div className="text-white/50 text-xs">M-PESA settlement received</div></div></div>
      </div>
      <div className="card p-5 mt-6"><div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="font-black text-gray-900">Top Contributors</h2><p className="text-sm text-gray-500">Internal ranking based only on confirmed USD contribution-ledger value.</p></div><Users className="text-primary" size={20}/></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase text-gray-400 border-b"><th className="py-2">Rank</th><th className="py-2">Donor</th><th className="py-2 text-right">Confirmed contributions</th><th className="py-2 text-right">Total</th></tr></thead><tbody>{(stats.top_contributors||[]).map((row,index)=><tr key={row.user_id} className="border-b last:border-0"><td className="py-3 font-black text-primary">#{index+1}</td><td className="py-3 font-semibold text-gray-900">{row.name}</td><td className="py-3 text-right text-gray-500">{row.contribution_count}</td><td className="py-3 text-right font-black">{formatCurrency(row.total_usd,'USD')}</td></tr>)}{!stats.top_contributors?.length&&<tr><td colSpan={4} className="py-8 text-center text-gray-400">No confirmed contributions yet.</td></tr>}</tbody></table></div></div>
    </>}
  </AdminLayout>;
}
