'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import DataTable, { Column } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ProjectForm from '../../components/ProjectForm';
import { getProjects } from '../../lib/api';
import { Project } from '../../types';
import { formatDate, formatCurrency, pct } from '../../lib/utils';
import toast from 'react-hot-toast';

const MOCK: Project[] = [
  { id: 'p1', title: 'Awareness Bags for Family Homes', description: 'Books, videos, cards, articles, and games to keep Palestine present at home', category: 'food', target_amount: 15000, raised_amount: 12400, beneficiaries_count: 500, location: 'Gaza City', status: 'active', created_at: '2025-03-01T10:00:00Z' },
  { id: 'p2', title: 'Plant a Tree in My Name', description: 'Symbolic Family Pledge project that connects supporters to Palestine with hope', category: 'water', target_amount: 8000, raised_amount: 8000, beneficiaries_count: 2000, location: 'North Gaza', status: 'completed', created_at: '2025-01-15T10:00:00Z' },
  { id: 'p3', title: 'Women-Headed Family Support', description: 'Support Palestinian women who provide for and protect their families', category: 'orphans', target_amount: 20000, raised_amount: 11500, beneficiaries_count: 115, location: 'Rafah', status: 'active', created_at: '2025-02-01T10:00:00Z' },
  { id: 'p4', title: 'Children’s Palestine Learning Pack', description: 'Child-friendly cards, comics, and activities about Jerusalem and Al-Aqsa', category: 'clothing', target_amount: 5000, raised_amount: 2100, beneficiaries_count: 300, location: 'Khan Yunis', status: 'paused', created_at: '2025-04-10T10:00:00Z' },
];

const CATEGORIES = ['food', 'water', 'clothing', 'emergency_cash', 'orphans', 'widows', 'children', 'general'];

type ModalMode = 'create' | 'edit' | null;

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editItem, setEditItem] = useState<Project | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      const filtered = filterCategory ? data.filter((p) => p.category === filterCategory) : data;
      setProjects(filtered);
    } catch {
      const filtered = filterCategory ? MOCK.filter((p) => p.category === filterCategory) : MOCK;
      setProjects(filtered);
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setModalMode('create'); };
  const openEdit = (item: Project) => { setEditItem(item); setModalMode('edit'); };
  const closeModal = () => { setModalMode(null); setEditItem(null); };

  const handleSuccess = (saved: Project) => {
    if (modalMode === 'create') {
      setProjects((prev) => [saved, ...prev]);
    } else {
      setProjects((prev) => prev.map((p) => p.id === saved.id ? saved : p));
    }
    closeModal();
  };

  const columns: Column<Project>[] = [
    {
      key: 'title', header: 'Project', render: (p) => (
        <div>
          <div className="font-medium text-gray-900">{p.title}</div>
          <div className="text-xs text-gray-400 capitalize">{p.category.replace(/_/g, ' ')} {p.location ? `· ${p.location}` : ''}</div>
        </div>
      )
    },
    {
      key: 'raised_amount', header: 'Funding', render: (p) => (
        <div className="w-36">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold">{formatCurrency(p.raised_amount)}</span>
            <span className="text-gray-400">{formatCurrency(p.target_amount)}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gold rounded-full" style={{ width: `${pct(p.raised_amount, p.target_amount)}%` }} />
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{pct(p.raised_amount, p.target_amount).toFixed(0)}% funded</div>
        </div>
      )
    },
    { key: 'beneficiaries_count', header: 'Beneficiaries', render: (p) => p.beneficiaries_count ? `${p.beneficiaries_count.toLocaleString()} people` : '—' },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'created_at', header: 'Created', render: (p) => formatDate(p.created_at) },
    {
      key: 'actions', header: '', render: (p) => (
        <button onClick={() => openEdit(p)} className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"><Edit2 size={14} /></button>
      )
    },
  ];

  return (
    <AdminLayout title="Projects" subtitle="Manage Family Pledge projects, awareness bags, and support programmes">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex flex-wrap gap-2 flex-1">
          <button onClick={() => setFilterCategory('')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterCategory === '' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>All</button>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filterCategory === cat ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={projects} loading={loading} />
      </div>

      {modalMode && (
        <div className="modal-shell">
          <div className="modal-panel">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{modalMode === 'create' ? 'Create Project' : 'Edit Project'}</h3>
            <ProjectForm initial={editItem || undefined} onSuccess={handleSuccess} onCancel={closeModal} />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
