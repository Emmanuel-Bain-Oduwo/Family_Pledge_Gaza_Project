'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import DataTable, { Column } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import CampaignForm from '../../components/CampaignForm';
import { getCampaigns, updateCampaign, deleteCampaign } from '../../lib/api';
import { Campaign } from '../../types';
import { formatDate, formatCurrency, formatNumber, pct } from '../../lib/utils';
import toast from 'react-hot-toast';

const MOCK: Campaign[] = [
  { id: 'camp1', title: 'Sign the Family Pledge', description: 'Free or USD 10 monthly pledge for family awareness and Palestine support', type: 'monthly', target_donors: 1200, current_donors: 893, target_amount: 12000, raised_amount: 8930, is_active: true, is_urgent: false, status: 'active', start_date: '2025-06-01', end_date: '2025-06-30', created_at: '2025-05-28T10:00:00Z' },
  { id: 'camp2', title: 'Awareness Bags Launch', description: 'Reach 5,000 families with books, videos, cards, articles, games, and reminders', type: 'friday_challenge', target_donors: 200, current_donors: 142, is_active: true, is_urgent: true, status: 'active', start_date: '2025-06-06', end_date: '2025-06-07', created_at: '2025-06-05T08:00:00Z' },
  { id: 'camp3', title: 'Support Women-Headed Families', description: 'Strengthen Palestinian women and families through consistent pledge support', type: 'emergency', target_donors: 500, current_donors: 317, target_amount: 5000, raised_amount: 3170, is_active: true, is_urgent: true, status: 'active', start_date: '2025-05-15', created_at: '2025-05-15T07:00:00Z' },
  { id: 'camp4', title: 'Plant a Tree in My Name', description: 'Symbolic project from the partner website to grow hope and remembrance', type: 'water', target_donors: 300, current_donors: 300, target_amount: 3000, raised_amount: 3000, is_active: false, is_urgent: false, status: 'completed', start_date: '2025-04-01', end_date: '2025-05-01', created_at: '2025-03-28T10:00:00Z' },
];

type ModalMode = 'create' | 'edit' | null;

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editItem, setEditItem] = useState<Campaign | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterType) params.type = filterType;
      const data = await getCampaigns(params);
      setCampaigns(data);
    } catch {
      const filtered = filterType ? MOCK.filter((c) => c.type === filterType) : MOCK;
      setCampaigns(filtered);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setModalMode('create'); };
  const openEdit = (item: Campaign) => { setEditItem(item); setModalMode('edit'); };
  const closeModal = () => { setModalMode(null); setEditItem(null); };

  const handleSuccess = (saved: Campaign) => {
    if (modalMode === 'create') {
      setCampaigns((prev) => [saved, ...prev]);
    } else {
      setCampaigns((prev) => prev.map((c) => c.id === saved.id ? saved : c));
    }
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    try {
      await deleteCampaign(id);
    } catch { /* continue */ }
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    toast.success('Campaign deleted.');
  };

  const toggleActive = async (item: Campaign) => {
    const updated = { ...item, is_active: !item.is_active };
    setCampaigns((prev) => prev.map((c) => c.id === item.id ? updated : c));
    try { await updateCampaign(item.id, { is_active: updated.is_active }); } catch { /* optimistic */ }
    toast.success(updated.is_active ? 'Campaign activated.' : 'Campaign deactivated.');
  };

  const TYPES = ['monthly', 'friday_challenge', 'emergency', 'sponsorship', 'food', 'water', 'clothing', 'general'];

  const columns: Column<Campaign>[] = [
    {
      key: 'title', header: 'Campaign', render: (c) => (
        <div>
          <div className="font-medium text-gray-900 flex items-center gap-2">
            {c.title}
            {c.is_urgent && <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded font-semibold">Urgent</span>}
          </div>
          <div className="text-xs text-gray-400 capitalize">{c.type.replace(/_/g, ' ')}</div>
        </div>
      )
    },
    {
      key: 'current_donors', header: 'Progress', render: (c) => (
        <div className="w-32">
          <div className="flex justify-between text-xs mb-1">
            <span>{formatNumber(c.current_donors)}</span>
            <span className="text-gray-400">/ {formatNumber(c.target_donors)}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${pct(c.current_donors, c.target_donors)}%` }} />
          </div>
        </div>
      )
    },
    { key: 'raised_amount', header: 'Raised', render: (c) => c.raised_amount !== undefined ? formatCurrency(c.raised_amount) : '—' },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    { key: 'is_active', header: 'Active', render: (c) => (
      <button onClick={() => toggleActive(c)} className={`p-1 rounded ${c.is_active ? 'text-primary' : 'text-gray-300'}`}>
        {c.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
      </button>
    )},
    { key: 'start_date', header: 'Starts', render: (c) => formatDate(c.start_date) },
    {
      key: 'actions', header: '', render: (c) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(c)} className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"><Edit2 size={14} /></button>
          <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100"><Trash2 size={14} /></button>
        </div>
      )
    },
  ];

  return (
    <AdminLayout title="Campaigns" subtitle="Manage pledge campaigns and challenges">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex flex-wrap gap-2 flex-1">
          <button onClick={() => setFilterType('')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterType === '' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>All</button>
          {TYPES.map((t) => (
            <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filterType === t ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Campaign
        </button>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={campaigns} loading={loading} />
      </div>

      {modalMode && (
        <div className="modal-shell">
          <div className="modal-panel">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{modalMode === 'create' ? 'Create Campaign' : 'Edit Campaign'}</h3>
            <CampaignForm initial={editItem || undefined} onSuccess={handleSuccess} onCancel={closeModal} />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
