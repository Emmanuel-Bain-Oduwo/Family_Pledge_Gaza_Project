'use client';
import { useEffect, useState, useCallback } from 'react';
import { Check, X, AlertCircle, MessageSquare, RefreshCw, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import DataTable, { Column } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { reviewContribution } from '../../lib/api';
import { getContributionPage, getContributionSummary, ContributionSummary } from '../../lib/contributionsApi';
import { getContributionProofLink } from '../../lib/contributionProof';
import { Contribution, ContributionStatus } from '../../types';
import { formatDate, formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function ContributionsPage() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [summary, setSummary] = useState<ContributionSummary>({ total:0,this_month:0,submitted:0,confirmed:0,rejected:0,needs_follow_up:0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [page,setPage]=useState(1); const [size,setSize]=useState(50); const [pages,setPages]=useState(1); const [total,setTotal]=useState(0);
  const [modalItem, setModalItem] = useState<Contribution | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [reviewAction, setReviewAction] = useState<ContributionStatus | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [openingProofId, setOpeningProofId] = useState<string | null>(null);

  useEffect(()=>{if(typeof window==='undefined')return;const initial=new URLSearchParams(window.location.search).get('status');if(initial)setFilterStatus(initial);},[]);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res,counts]=await Promise.all([getContributionPage({page,size,status:filterStatus||undefined}),getContributionSummary()]);
      setContributions(res.items);setTotal(res.total);setPages(res.pages);setSummary(counts);
      if(page>res.pages)setPage(res.pages);
    } catch (e: any) { toast.error(e.message || 'Could not load contributions.'); }
    finally { setLoading(false); }
  }, [filterStatus,page,size]);

  useEffect(() => { void load(); const timer = window.setInterval(()=>void load(), 30_000); return () => window.clearInterval(timer); }, [load]);
  const setStatus=(value:string)=>{setFilterStatus(value);setPage(1);};
  const openReview = (item: Contribution, action: ContributionStatus) => { setModalItem(item); setReviewAction(action); setAdminNote(item.admin_note || ''); };

  const openProof = async (item: Contribution) => {
    setOpeningProofId(item.id);
    try { const proof = await getContributionProofLink(item.id); const opened = window.open(proof.url, '_blank', 'noopener,noreferrer'); if (!opened) toast.error('Your browser blocked the proof window. Allow pop-ups and try again.'); }
    catch (e: any) { toast.error(e.message || 'Could not open this contribution proof.'); }
    finally { setOpeningProofId(null); }
  };

  const submitReview = async () => {
    if (!modalItem || !reviewAction) return;
    setReviewing(true);
    try {
      await reviewContribution(modalItem.id, { status: reviewAction, admin_note: adminNote });
      toast.success(`Marked as ${reviewAction.replace(/_/g, ' ')}.`); setModalItem(null); await load();
    } catch (e: any) { toast.error(e.message || 'Could not update this contribution.'); }
    finally { setReviewing(false); }
  };

  const proofButton = (c: Contribution, compact = false) => {
    if (!(c.proof_available || c.proof_url)) return <span className="text-xs text-gray-400">Message/reference</span>;
    const opening = openingProofId === c.id;
    return <div><button type="button" onClick={() => openProof(c)} disabled={opening} className={`${compact ? 'inline-flex' : 'flex w-full justify-center'} items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-primary hover:bg-gray-50 disabled:opacity-60`}><ImageIcon size={14} /> {opening ? 'Opening…' : 'View screenshot'}</button>{c.proof_expires_at && !compact && <p className="mt-1 text-center text-[11px] text-gray-400">Private proof retained until {formatDate(c.proof_expires_at)}.</p>}</div>;
  };

  const columns: Column<Contribution>[] = [
    { key: 'donor_name', header: 'Donor', render: (c) => <div><div className="font-medium">{c.donor_name}</div><div className="text-xs text-gray-400">{c.month} {c.year}</div></div> },
    { key: 'amount', header: 'Amount', render: (c) => <span className="font-semibold">{formatCurrency(c.amount, c.currency)}</span> },
    { key: 'reference', header: 'Reference', render: (c) => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{c.reference}</span> },
    { key: 'payment_method', header: 'Method', render: (c) => <span className="text-xs capitalize">{c.payment_method.replace(/_/g, ' ')}</span> },
    { key: 'proof_url', header: 'Proof', render: (c) => proofButton(c, true) },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    { key: 'submitted_at', header: 'Submitted', render: (c) => formatDate(c.submitted_at) },
    { key: 'actions', header: 'Actions', render: (c) => <div className="flex gap-1">{c.status !== 'confirmed' && <button onClick={() => openReview(c, 'confirmed')} title="Confirm" className="p-1.5 rounded bg-green-50 text-green-600 hover:bg-green-100"><Check size={14} /></button>}{c.status !== 'rejected' && <button onClick={() => openReview(c, 'rejected')} title="Reject" className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100"><X size={14} /></button>}{c.status !== 'needs_follow_up' && <button onClick={() => openReview(c, 'needs_follow_up')} title="Needs follow-up" className="p-1.5 rounded bg-amber-50 text-amber-600 hover:bg-amber-100"><AlertCircle size={14} /></button>}{c.admin_note && <button onClick={() => { setModalItem(c); setAdminNote(c.admin_note || ''); setReviewAction(null); }} title="View note" className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"><MessageSquare size={14} /></button>}</div> },
  ];

  const filters=[{value:'',label:`All (${summary.total})`},{value:'submitted',label:`Submitted (${summary.submitted})`},{value:'confirmed',label:`Confirmed (${summary.confirmed})`},{value:'rejected',label:`Rejected (${summary.rejected})`},{value:'needs_follow_up',label:`Follow Up (${summary.needs_follow_up})`}];
  return <AdminLayout title="Contribution Review Queue" subtitle={`${summary.this_month.toLocaleString()} submissions this month · ${summary.submitted.toLocaleString()} currently waiting for review`}>
    <div className="flex flex-wrap gap-2 items-center mb-5">{filters.map((f)=><button key={f.value} onClick={()=>setStatus(f.value)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus===f.value?'bg-primary text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{f.label}</button>)}<button onClick={()=>void load()} disabled={loading} className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"><RefreshCw size={15} className={loading?'animate-spin':''}/>Refresh</button><span className="w-full text-right text-xs text-gray-400">Server totals · page {page} of {pages} · auto-refresh every 30 seconds</span></div>
    <div className="card overflow-hidden"><DataTable columns={columns} data={contributions} loading={loading}/><div className="border-t bg-gray-50 p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="text-xs text-gray-500">Showing {contributions.length} of {total.toLocaleString()} matching records · <select className="rounded border bg-white px-2 py-1" value={size} onChange={e=>{setSize(Number(e.target.value));setPage(1);}}><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select> rows</div><div className="flex items-center gap-2"><button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="btn-secondary inline-flex items-center gap-1"><ChevronLeft size={14}/>Previous</button><button disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))} className="btn-secondary inline-flex items-center gap-1">Next<ChevronRight size={14}/></button></div></div></div>
    {modalItem && <div className="modal-shell"><div className="modal-panel max-w-md"><h3 className="text-lg font-bold text-gray-900 mb-1">{reviewAction ? `Mark as ${reviewAction.replace(/_/g, ' ')}` : 'Admin Note'}</h3><p className="text-sm text-gray-500 mb-4">Ref: <span className="font-mono font-semibold">{modalItem.reference}</span> · {modalItem.donor_name}</p>{(modalItem.proof_available || modalItem.proof_url) && <div className="mb-4">{proofButton(modalItem)}</div>}<div className="mb-4"><label className="label">Admin Note {reviewAction ? '(optional)' : ''}</label><textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className="input" rows={3} placeholder="Internal note for this decision…" /></div>{reviewAction ? <div className="modal-actions"><button onClick={()=>void submitReview()} disabled={reviewing} className="btn-primary flex-1">{reviewing ? 'Saving…' : `Confirm: ${reviewAction.replace(/_/g, ' ')}`}</button><button onClick={() => setModalItem(null)} className="btn-ghost">Cancel</button></div> : <button onClick={() => setModalItem(null)} className="btn-ghost w-full">Close</button>}</div></div>}
  </AdminLayout>;
}
