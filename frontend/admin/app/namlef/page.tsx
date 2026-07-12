'use client';
import { useEffect, useState } from 'react';
import { Plus, Edit2, Star } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import DataTable, { Column } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import NamlefContentForm from '../../components/NamlefContentForm';
import { getNamlefContent, updateNamlefContent } from '../../lib/api';
import { NamlefContent, NamlefContentType } from '../../types';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

const MOCK: NamlefContent[] = [
  { id: 'n1', speaker_name: 'Sheikh Abdur Rahman Ishaq', speaker_role: 'Imam of Parklands Mosque, Nairobi', content_type: 'video', title: 'Palestine Is a Trust', description: 'A local partner message inviting families to join the pledge and contribute consistently if able.', featured: true, status: 'published', created_at: '2025-06-07T12:00:00Z' },
  { id: 'n2', speaker_name: 'Family Pledge Secretariat', speaker_role: 'Awareness Programme', content_type: 'audio', title: 'What Families Receive After Signing', description: 'Books, videos, podcasts, comics, cards, articles, and games for monthly Palestine awareness.', featured: false, status: 'published', created_at: '2025-05-30T10:00:00Z' },
  { id: 'n3', speaker_name: 'NAMLEF Gaza Family Support', content_type: 'text', title: 'About Family Pledge', description: 'Simple family covenant: sign for free or donate USD 10 monthly to support Palestinian families.', featured: true, status: 'published', created_at: '2025-05-10T08:00:00Z' },
  { id: 'n4', speaker_name: 'Global Family Pledge Partners', speaker_role: 'Jerusalem and Palestine Supporters', content_type: 'link', title: 'Support for Palestinian Women', description: 'Partner voices about strengthening Palestinian women and family resilience.', featured: false, status: 'draft', created_at: '2025-06-08T16:00:00Z' },
];

const CONTENT_TYPES: NamlefContentType[] = ['video', 'audio', 'text', 'link'];

const TYPE_BADGE: Record<NamlefContentType, string> = {
  video: 'bg-red-100 text-red-700',
  audio: 'bg-purple-100 text-purple-700',
  text: 'bg-blue-100 text-blue-700',
  link: 'bg-gray-100 text-gray-700',
};

type ModalMode = 'create' | 'edit' | null;

export default function NamlefPage() {
  const [content, setContent] = useState<NamlefContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editItem, setEditItem] = useState<NamlefContent | null>(null);
  useEffect(() => {
    getNamlefContent()
      .then(setContent)
      .catch(() => setContent(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterType ? content.filter((c) => c.content_type === filterType) : content;

  const openCreate = () => { setEditItem(null); setModalMode('create'); };
  const openEdit = (item: NamlefContent) => { setEditItem(item); setModalMode('edit'); };
  const closeModal = () => { setModalMode(null); setEditItem(null); };

  const handleSuccess = (saved: NamlefContent) => {
    if (modalMode === 'create') {
      setContent((prev) => [saved, ...prev]);
    } else {
      setContent((prev) => prev.map((c) => c.id === saved.id ? saved : c));
    }
    closeModal();
  };

  const toggleFeatured = async (item: NamlefContent) => {
    const updated = { ...item, featured: !item.featured };
    setContent((prev) => prev.map((c) => c.id === item.id ? updated : c));
    try { await updateNamlefContent(item.id, { featured: updated.featured }); } catch { /* optimistic */ }
    toast.success(updated.featured ? 'Marked as featured.' : 'Removed from featured.');
  };

  const columns: Column<NamlefContent>[] = [
    {
      key: 'title', header: 'Content', render: (c) => (
        <div>
          <div className="font-medium text-gray-900 flex items-center gap-2">
            {c.title}
            {c.featured && <Star size={12} className="text-gold fill-gold" />}
          </div>
          <div className="text-xs text-gray-400">{c.speaker_name}{c.speaker_role ? ` · ${c.speaker_role}` : ''}</div>
        </div>
      )
    },
    { key: 'content_type', header: 'Type', render: (c) => <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${TYPE_BADGE[c.content_type]}`}>{c.content_type}</span> },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    { key: 'created_at', header: 'Added', render: (c) => formatDate(c.created_at) },
    {
      key: 'actions', header: '', render: (c) => (
        <div className="flex gap-1">
          <button onClick={() => toggleFeatured(c)} title={c.featured ? 'Remove from featured' : 'Feature this'} className={`p-1.5 rounded ${c.featured ? 'bg-amber-50 text-gold' : 'bg-gray-50 text-gray-300 hover:text-gray-400'}`}>
            <Star size={14} className={c.featured ? 'fill-gold' : ''} />
          </button>
          <button onClick={() => openEdit(c)} className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"><Edit2 size={14} /></button>
        </div>
      )
    },
  ];

  return (
    <AdminLayout title="NAMLEF Content" subtitle="Manage content from national Muslim leaders for donors">
      {/* Header banner */}
      <div className="card bg-primary-dark p-5 mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-white font-bold text-lg">National Muslim Leaders Forum — East Africa</div>
          <div className="text-white/60 text-sm mt-0.5">Share guidance from scholars and leaders to inspire and educate donors</div>
        </div>
        <button onClick={openCreate} className="bg-gold text-primary-dark font-semibold px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Plus size={16} /> Add Content
        </button>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setFilterType('')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterType === '' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>All</button>
        {CONTENT_TYPES.map((t) => (
          <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filterType === t ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{t}</button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={filtered} loading={loading} />
      </div>

      {modalMode && (
        <div className="modal-shell">
          <div className="modal-panel">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{modalMode === 'create' ? 'Add NAMLEF Content' : 'Edit Content'}</h3>
            <NamlefContentForm initial={editItem || undefined} onSuccess={handleSuccess} onCancel={closeModal} />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
