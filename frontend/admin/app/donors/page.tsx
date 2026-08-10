'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Download, Filter, Mail, MessageCircle, Search,
  SlidersHorizontal, Sparkles, UserRoundCog, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import StatusBadge from '../../components/StatusBadge';
import {
  DonorDetail, DonorSegment, OperationsDonor, downloadDonorExport, getDonorDetail,
  getOperationsDonors, updateDonorProfile,
} from '../../lib/operationsApi';
import { formatDate, formatDateTime } from '../../lib/utils';

const SEGMENTS: Array<{ value: DonorSegment; label: string }> = [
  { value: 'all_donors', label: 'All donors' },
  { value: 'active_pledges', label: 'Active pledges' },
  { value: 'missing_this_month', label: 'Missing this month' },
  { value: 'pending_review', label: 'Pending review' },
  { value: 'confirmed_this_month', label: 'Confirmed this month' },
  { value: 'inactive_30_days', label: 'Inactive 30+ days' },
  { value: 'new_this_month', label: 'New this month' },
  { value: 'collectors', label: 'Collectors' },
];

export default function DonorsPage() {
  const [items, setItems] = useState<OperationsDonor[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(50);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [segment, setSegment] = useState<DonorSegment>('all_donors');
  const [priority, setPriority] = useState('');
  const [followupStatus, setFollowupStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<DonorDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState({ priority: 'normal', followup_status: 'none', tags: '', internal_notes: '', next_followup_at: '' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initial = new URLSearchParams(window.location.search).get('segment') as DonorSegment | null;
    if (initial && SEGMENTS.some((s) => s.value === initial)) setSegment(initial);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOperationsDonors({
        page, size, segment,
        search: search.trim() || undefined,
        country: country.trim() || undefined,
        priority: priority || undefined,
        followup_status: followupStatus || undefined,
      });
      setItems(data.items);
      setTotal(data.total);
      setPages(data.pages);
      if (page > data.pages) setPage(data.pages);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load donors.');
      setItems([]);
    } finally { setLoading(false); }
  }, [page, size, segment, search, country, priority, followupStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, search ? 350 : 0);
    return () => window.clearTimeout(timer);
  }, [load, search]);

  const changeSegment = (value: DonorSegment) => { setSegment(value); setPage(1); };
  const openDonor = async (row: OperationsDonor) => {
    setDetailLoading(true);
    try {
      const d = await getDonorDetail(row.id);
      setDetail(d);
      setEdit({
        priority: d.donor.priority || 'normal',
        followup_status: d.donor.followup_status || 'none',
        tags: (d.donor.tags || []).join(', '),
        internal_notes: d.internal_notes || '',
        next_followup_at: d.donor.next_followup_at ? toLocalInput(d.donor.next_followup_at) : '',
      });
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not open donor.'); }
    finally { setDetailLoading(false); }
  };
  const saveDetail = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      await updateDonorProfile(detail.donor.id, {
        priority: edit.priority,
        followup_status: edit.followup_status,
        tags: edit.tags.split(',').map((x) => x.trim()).filter(Boolean),
        internal_notes: edit.internal_notes.trim() || null,
        next_followup_at: edit.next_followup_at ? new Date(edit.next_followup_at).toISOString() : null,
      });
      toast.success('Donor management record saved.');
      const refreshed = await getDonorDetail(detail.donor.id);
      setDetail(refreshed);
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save donor record.'); }
    finally { setSaving(false); }
  };
  const exportCsv = async () => {
    try { await downloadDonorExport(segment); toast.success('CSV export downloaded.'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not export donors.'); }
  };

  return <AdminLayout title="Donor Management" subtitle="A searchable, categorized operations view built for thousands of Family Pledge users.">
    <div className="card mb-4 p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative flex-1 min-w-0"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={(e)=>{setSearch(e.target.value);setPage(1);}} placeholder="Search name, nickname, email or phone…" className="input pl-9"/></div>
        <select className="input xl:w-52" value={segment} onChange={(e)=>changeSegment(e.target.value as DonorSegment)}>{SEGMENTS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select>
        <input className="input xl:w-40" value={country} onChange={(e)=>{setCountry(e.target.value);setPage(1);}} placeholder="Country"/>
        <select className="input xl:w-36" value={priority} onChange={(e)=>{setPriority(e.target.value);setPage(1);}}><option value="">Any priority</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select>
        <select className="input xl:w-40" value={followupStatus} onChange={(e)=>{setFollowupStatus(e.target.value);setPage(1);}}><option value="">Any follow-up</option><option value="due">Due</option><option value="watching">Watching</option><option value="contacted">Contacted</option><option value="snoozed">Snoozed</option><option value="resolved">Resolved</option><option value="none">None</option></select>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500"><div className="inline-flex items-center gap-2"><Filter size={13}/><b>{total.toLocaleString()}</b> matching donors · page {page} of {pages}</div><div className="flex flex-wrap gap-2"><button onClick={()=>void exportCsv()} className="btn-secondary inline-flex items-center gap-2"><Download size={14}/>Export current segment</button><Link href="/operations" className="btn-secondary inline-flex items-center gap-2"><MessageCircle size={14}/>Remind this segment</Link><Link href="/ai/chat" className="btn-secondary inline-flex items-center gap-2"><Sparkles size={14}/>Ask AI</Link></div></div>
    </div>

    <div className="card overflow-hidden">
      <div className="overflow-x-auto max-h-[65vh]">
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50 border-b"><tr className="text-left text-xs uppercase tracking-wide text-gray-500"><th className="p-3">#</th><th className="p-3">Donor</th><th className="p-3">Location</th><th className="p-3">Pledge</th><th className="p-3">This month</th><th className="p-3">Consistency</th><th className="p-3">Follow-up</th><th className="p-3">Priority</th><th className="p-3">Channels</th><th className="p-3">Last activity</th></tr></thead>
          <tbody>{loading?<tr><td colSpan={10} className="p-12 text-center text-gray-400">Loading donor operations…</td></tr>:items.map(row=><tr key={row.id} onClick={()=>void openDonor(row)} className="border-b hover:bg-emerald-50/30 cursor-pointer align-top"><td className="p-3 text-gray-400">#{row.donor_number}</td><td className="p-3"><div className="font-semibold text-gray-900">{row.full_name||'Donor'}</div>{row.nickname&&<div className="text-xs text-gray-400">{row.nickname}</div>}{row.tags.length>0&&<div className="mt-1 flex max-w-52 flex-wrap gap-1">{row.tags.slice(0,3).map(t=><span key={t} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{t}</span>)}</div>}</td><td className="p-3 text-gray-600">{[row.city,row.country].filter(Boolean).join(', ')||'—'}</td><td className="p-3"><StatusBadge status={row.pledge_status}/></td><td className="p-3"><StatusBadge status={row.contribution_status_this_month}/></td><td className="p-3"><b>{row.months_consistent}</b> mo.</td><td className="p-3"><span className="capitalize">{row.followup_status.replace(/_/g,' ')}</span>{row.next_followup_at&&<div className="text-[11px] text-gray-400 mt-1">Due {formatDate(row.next_followup_at)}</div>}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-[11px] font-bold capitalize ${row.priority==='urgent'?'bg-red-100 text-red-700':row.priority==='high'?'bg-amber-100 text-amber-700':'bg-gray-100 text-gray-600'}`}>{row.priority}</span></td><td className="p-3"><div className="flex gap-1"><span title="Email reminder opt-in" className={`rounded p-1 ${row.email_reminders_opt_in?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-300'}`}><Mail size={13}/></span><span title="WhatsApp reminder opt-in" className={`rounded p-1 ${row.whatsapp_reminders_opt_in?'bg-green-100 text-green-700':'bg-gray-100 text-gray-300'}`}><MessageCircle size={13}/></span></div></td><td className="p-3 text-xs text-gray-500">{row.last_contribution_at?formatDate(row.last_contribution_at):'No contribution yet'}</td></tr>)}{!loading&&!items.length&&<tr><td colSpan={10} className="p-12 text-center text-gray-400">No donors match these filters.</td></tr>}</tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-xs text-gray-500"><SlidersHorizontal size={13}/>Rows<select className="rounded border bg-white px-2 py-1" value={size} onChange={(e)=>{setSize(Number(e.target.value));setPage(1);}}><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></div><div className="flex items-center gap-2"><button className="btn-secondary inline-flex items-center gap-1" disabled={page<=1} onClick={()=>setPage((p)=>Math.max(1,p-1))}><ChevronLeft size={14}/>Previous</button><span className="text-xs text-gray-500">{page}/{pages}</span><button className="btn-secondary inline-flex items-center gap-1" disabled={page>=pages} onClick={()=>setPage((p)=>Math.min(pages,p+1))}>Next<ChevronRight size={14}/></button></div></div>
    </div>

    {(detail||detailLoading)&&<div className="fixed inset-0 z-[80] bg-black/30" onClick={()=>setDetail(null)}><aside onClick={(e)=>e.stopPropagation()} className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4"><div className="flex items-center gap-2"><UserRoundCog size={19} className="text-primary"/><b>Donor record</b></div><button onClick={()=>setDetail(null)} className="rounded-lg p-2 hover:bg-gray-100"><X size={18}/></button></div>{detailLoading&&!detail?<div className="p-10 text-center text-gray-400">Loading donor…</div>:detail&&<div className="space-y-5 p-5"><div className="rounded-2xl bg-[#101827] p-5 text-white"><div className="text-xl font-black">{detail.donor.full_name||'Donor'}</div><div className="mt-1 text-sm text-white/60">#{detail.donor.donor_number} · {[detail.donor.city,detail.donor.country].filter(Boolean).join(', ')||'Location not set'}</div><div className="mt-4 grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl bg-white/10 p-3"><div className="text-white/50 text-xs">Email</div><div className="mt-1 break-all">{detail.email||'Not provided'}</div></div><div className="rounded-xl bg-white/10 p-3"><div className="text-white/50 text-xs">Phone</div><div className="mt-1">{detail.phone||'Not provided'}</div></div></div></div>
      <div className="grid grid-cols-2 gap-3"><div><label className="label">Priority</label><select className="input" value={edit.priority} onChange={e=>setEdit({...edit,priority:e.target.value})}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div><div><label className="label">Follow-up status</label><select className="input" value={edit.followup_status} onChange={e=>setEdit({...edit,followup_status:e.target.value})}><option value="none">None</option><option value="watching">Watching</option><option value="due">Due</option><option value="contacted">Contacted</option><option value="snoozed">Snoozed</option><option value="resolved">Resolved</option></select></div></div>
      <div><label className="label">Next follow-up</label><input type="datetime-local" className="input" value={edit.next_followup_at} onChange={e=>setEdit({...edit,next_followup_at:e.target.value})}/></div><div><label className="label">Tags</label><input className="input" value={edit.tags} onChange={e=>setEdit({...edit,tags:e.target.value})} placeholder="e.g. Nairobi, Friday supporter, needs call"/><p className="mt-1 text-xs text-gray-400">Separate tags with commas.</p></div><div><label className="label">Private admin notes</label><textarea className="input" rows={4} value={edit.internal_notes} onChange={e=>setEdit({...edit,internal_notes:e.target.value})} placeholder="Operational notes for the admin team…"/></div><button disabled={saving} onClick={()=>void saveDetail()} className="btn-primary w-full">{saving?'Saving…':'Save management record'}</button>
      <div><h3 className="font-bold mb-2">Reminder consent</h3><div className="grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl border p-3"><Mail size={15} className="mb-1"/><b>Email</b><div className={detail.donor.email_reminders_opt_in?'text-green-600':'text-gray-400'}>{detail.donor.email_reminders_opt_in?'Opted in':'Not opted in'}</div></div><div className="rounded-xl border p-3"><MessageCircle size={15} className="mb-1"/><b>WhatsApp</b><div className={detail.donor.whatsapp_reminders_opt_in?'text-green-600':'text-gray-400'}>{detail.donor.whatsapp_reminders_opt_in?'Opted in':'Not opted in'}</div></div></div></div>
      <div><h3 className="font-bold mb-2">Recent contributions</h3><div className="space-y-2">{detail.recent_contributions.map((c:any)=><div key={String(c.id)} className="rounded-xl border p-3 text-sm flex justify-between gap-3"><div><b>{String(c.month)}</b><div className="text-xs text-gray-400">{c.created_at?formatDateTime(String(c.created_at)):''}</div></div><div className="text-right"><b>{String(c.currency)} {Number(c.amount||0).toLocaleString()}</b><div className="text-xs capitalize text-gray-500">{String(c.status).replace(/_/g,' ')}</div></div></div>)}{!detail.recent_contributions.length&&<div className="text-sm text-gray-400">No contribution history.</div>}</div></div>
      <div><h3 className="font-bold mb-2">Open follow-ups</h3><div className="space-y-2">{detail.open_followups.map((f:any)=><div key={String(f.id)} className="rounded-xl bg-amber-50 p-3 text-sm"><div className="font-semibold capitalize">{String(f.type).replace(/_/g,' ')}</div><div className="mt-1 text-gray-600">{String(f.reason)}</div></div>)}{!detail.open_followups.length&&<div className="text-sm text-gray-400">No open follow-up cases.</div>}</div></div>
      <div className="flex gap-2"><Link href="/operations" className="btn-primary flex-1 text-center">Create reminder</Link><Link href="/ai/chat" className="btn-secondary flex-1 text-center">Ask AI</Link></div>
    </div>}</aside></div>}
  </AdminLayout>;
}

function toLocalInput(value:string){const d=new Date(value);const offset=d.getTimezoneOffset();return new Date(d.getTime()-offset*60000).toISOString().slice(0,16);}
