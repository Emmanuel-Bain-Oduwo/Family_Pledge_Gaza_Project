'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, RefreshCw, Sparkles } from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import DataTable, { Column } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import CampaignForm from '../../components/CampaignForm';
import { getCampaigns, updateCampaign, deleteCampaign } from '../../lib/api';
import { Campaign } from '../../types';
import { formatDate, formatCurrency, formatNumber, pct } from '../../lib/utils';
import toast from 'react-hot-toast';

type ModalMode = 'create' | 'edit' | null;

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editItem, setEditItem] = useState<Campaign | null>(null);
  const [error,setError]=useState<string|null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const params: Record<string, string> = {}; if (filterType) params.type = filterType; setCampaigns(await getCampaigns(params)); }
    catch (e) { setCampaigns([]); setError(e instanceof Error?e.message:'Could not load campaigns.'); }
    finally { setLoading(false); }
  }, [filterType]);
  useEffect(() => { void load(); }, [load]);

  const openCreate = () => { setEditItem(null); setModalMode('create'); };
  const openEdit = (item: Campaign) => { setEditItem(item); setModalMode('edit'); };
  const closeModal = () => { setModalMode(null); setEditItem(null); };
  const handleSuccess = () => { closeModal(); void load(); };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    try { await deleteCampaign(id); toast.success('Campaign deleted.'); await load(); }
    catch (e) { toast.error(e instanceof Error?e.message:'Could not delete campaign. Nothing changed.'); }
  };

  const toggleActive = async (item: Campaign) => {
    try {
      const updated = await updateCampaign(item.id, { is_active: !item.is_active });
      setCampaigns((prev) => prev.map((c) => c.id === item.id ? updated : c));
      toast.success(updated.is_active ? 'Campaign activated.' : 'Campaign deactivated.');
    } catch (e) { toast.error(e instanceof Error?e.message:'Could not change campaign status.'); }
  };

  const TYPES = ['monthly', 'friday_challenge', 'emergency', 'sponsorship', 'food', 'water', 'clothing', 'general'];
  const columns: Column<Campaign>[] = [
    { key: 'title', header: 'Campaign', render: (c) => <div><div className="font-medium text-gray-900 flex items-center gap-2">{c.title}{c.is_urgent && <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded font-semibold">Urgent</span>}</div><div className="text-xs text-gray-400 capitalize">{c.type.replace(/_/g, ' ')}</div></div> },
    { key: 'current_donors', header: 'Progress', render: (c) => <div className="w-32"><div className="flex justify-between text-xs mb-1"><span>{formatNumber(c.current_donors)}</span><span className="text-gray-400">/ {formatNumber(c.target_donors)}</span></div><div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${pct(c.current_donors, c.target_donors)}%` }} /></div></div> },
    { key: 'raised_amount', header: 'Raised', render: (c) => c.raised_amount !== undefined ? formatCurrency(c.raised_amount) : '—' },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    { key: 'is_active', header: 'Active', render: (c) => <button onClick={() => void toggleActive(c)} className={`p-1 rounded ${c.is_active ? 'text-primary' : 'text-gray-300'}`}>{c.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}</button> },
    { key: 'start_date', header: 'Starts', render: (c) => formatDate(c.start_date) },
    { key: 'actions', header: '', render: (c) => <div className="flex gap-1"><button onClick={() => openEdit(c)} className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"><Edit2 size={14} /></button><button onClick={() => void handleDelete(c.id)} className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100"><Trash2 size={14} /></button></div> },
  ];

  return <AdminLayout title="Campaign Studio" subtitle="Create, monitor and manage verified Family Pledge campaigns without fake local success states.">
    <div className="flex flex-wrap items-center gap-3 mb-5"><div className="flex flex-wrap gap-2 flex-1"><button onClick={() => setFilterType('')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterType === '' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>All</button>{TYPES.map((t)=><button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filterType === t ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{t.replace(/_/g, ' ')}</button>)}</div><button onClick={()=>void load()} className="btn-secondary inline-flex items-center gap-2"><RefreshCw size={15}/>Refresh</button><Link href="/ai/chat" className="btn-secondary inline-flex items-center gap-2"><Sparkles size={15}/>Plan with AI</Link><button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} /> New Campaign</button></div>
    {error&&<div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error} <button onClick={()=>void load()} className="ml-2 underline font-semibold">Retry</button></div>}
    <div className="card overflow-hidden"><DataTable columns={columns} data={campaigns} loading={loading} emptyMessage="No campaigns found." /></div>
    {modalMode && <div className="modal-shell"><div className="modal-panel"><h3 className="text-lg font-bold text-gray-900 mb-4">{modalMode === 'create' ? 'Create Campaign' : 'Edit Campaign'}</h3><CampaignForm initial={editItem || undefined} onSuccess={handleSuccess} onCancel={closeModal} /></div></div>}
  </AdminLayout>;
}
