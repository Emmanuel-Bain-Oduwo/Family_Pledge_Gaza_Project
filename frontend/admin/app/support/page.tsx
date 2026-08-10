'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Inbox, MessageSquareReply, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import { AdminSupportMessage, getSupportMessages, updateSupportMessage } from '../../lib/supportApi';

export default function SupportInboxPage() {
  const [items, setItems] = useState<AdminSupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdminSupportMessage | null>(null);
  const [response, setResponse] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await getSupportMessages(status || undefined)); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not load support inbox.'); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => [item.subject,item.message,item.category,item.user_display_name,item.user_email,item.user_phone].some(value => String(value || '').toLowerCase().includes(q)));
  }, [items, search]);

  const open = (item: AdminSupportMessage) => { setSelected(item); setResponse(item.admin_response || ''); };

  const save = async (nextStatus?: 'open'|'in_progress'|'resolved') => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await updateSupportMessage(selected.id, { admin_response: response.trim(), status: nextStatus || selected.status });
      setItems(current => current.map(item => item.id === updated.id ? updated : item));
      setSelected(updated);
      toast.success(nextStatus === 'resolved' ? 'Support request resolved.' : 'Response saved.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save response.'); }
    finally { setSaving(false); }
  };

  const counts = {
    open: items.filter(i=>i.status==='open').length,
    active: items.filter(i=>i.status==='in_progress').length,
    resolved: items.filter(i=>i.status==='resolved').length,
  };

  return <AdminLayout title="Support Inbox" subtitle="Donor messages, contribution questions and account support in one place.">
    <div className="grid gap-3 sm:grid-cols-3 mb-5">
      <Stat label="Open" value={counts.open} /><Stat label="In progress" value={counts.active}/><Stat label="Resolved in view" value={counts.resolved}/>
    </div>

    <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[220px]"><Search size={16} className="absolute left-3 top-3 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} className="input pl-9" placeholder="Search donor, subject, category or message..."/></div>
      <select value={status} onChange={e=>setStatus(e.target.value)} className="input w-full sm:w-44"><option value="">All statuses</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select>
      <button onClick={()=>void load()} className="btn-secondary inline-flex items-center gap-2"><RefreshCw size={15} className={loading?'animate-spin':''}/>Refresh</button>
    </div>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="card overflow-hidden">
        {loading ? <div className="p-10 text-center text-sm text-gray-500">Loading support inbox…</div> : visible.length===0 ? <div className="p-10 text-center"><Inbox className="mx-auto text-gray-300"/><div className="mt-2 font-semibold text-gray-700">No support messages in this view.</div></div> : <div className="divide-y divide-gray-100">{visible.map(item=><button key={item.id} onClick={()=>open(item)} className={`w-full p-4 text-left hover:bg-gray-50 ${selected?.id===item.id?'bg-primary/5':''}`}><div className="flex gap-3 justify-between"><div className="min-w-0"><div className="font-bold text-gray-900 truncate">{item.subject}</div><div className="mt-1 text-xs text-gray-500">{item.user_display_name || 'Donor'} · {item.category.replace('_',' ')} · {new Date(item.created_at).toLocaleString()}</div></div><Status value={item.status}/></div><div className="mt-2 line-clamp-2 text-sm text-gray-600">{item.message}</div></button>)}</div>}
      </div>

      <aside className="card p-5 h-fit xl:sticky xl:top-4">
        {!selected ? <div className="py-12 text-center text-gray-500"><MessageSquareReply className="mx-auto mb-2 text-gray-300"/><p className="text-sm">Select a support message to reply.</p></div> : <>
          <div className="flex items-start justify-between gap-3"><div><h2 className="font-black text-gray-900">{selected.subject}</h2><p className="mt-1 text-xs text-gray-500 capitalize">{selected.category} · {new Date(selected.created_at).toLocaleString()}</p></div><Status value={selected.status}/></div>
          <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3"><div className="text-xs font-bold uppercase tracking-wide text-gray-400">Donor</div><div className="mt-1 font-semibold text-gray-900">{selected.user_display_name || 'Donor'}</div>{selected.user_email&&<div className="text-xs text-gray-500 mt-1">{selected.user_email}</div>}{selected.user_phone&&<div className="text-xs text-gray-500">{selected.user_phone}</div>}</div>
          <div className="mt-4"><div className="label">Message</div><div className="rounded-xl border border-gray-200 bg-white p-3 text-sm leading-6 text-gray-700 whitespace-pre-wrap">{selected.message}</div></div>
          <div className="mt-4"><label className="label">Admin response</label><textarea value={response} onChange={e=>setResponse(e.target.value)} rows={7} className="input" placeholder="Write a helpful response. The donor will see it in the app."/></div>
          <div className="mt-4 flex flex-wrap gap-2"><button disabled={saving} onClick={()=>void save('in_progress')} className="btn-primary">{saving?'Saving…':'Save Response'}</button><button disabled={saving} onClick={()=>void save('resolved')} className="btn-secondary inline-flex items-center gap-2"><CheckCircle2 size={15}/>Resolve</button></div>
          <p className="mt-3 text-xs leading-5 text-gray-400">Responses are visible to the authenticated donor in Support. Do not place private payment credentials or unnecessary proof details in replies.</p>
        </>}
      </aside>
    </div>
  </AdminLayout>;
}

function Stat({label,value}:{label:string;value:number}){return <div className="card p-4"><div className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</div><div className="mt-1 text-2xl font-black text-gray-900">{value}</div></div>}
function Status({value}:{value:string}){const cls=value==='resolved'?'bg-emerald-50 text-emerald-700':value==='in_progress'?'bg-blue-50 text-blue-700':'bg-amber-50 text-amber-700';return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${cls}`}>{value.replace('_',' ')}</span>}
