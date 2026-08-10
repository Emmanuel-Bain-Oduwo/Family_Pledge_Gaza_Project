'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Send, RefreshCw, CalendarClock } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import DataTable, { Column } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ReminderForm from '../../components/ReminderForm';
import { publishReminder } from '../../lib/api';
import { AdminReminder, getAdminReminders } from '../../lib/remindersAdminApi';
import { Reminder, ReminderType } from '../../types';
import { formatDate, formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';

const TYPES: ReminderType[] = ['quran', 'hadith', 'dua', 'motivation', 'friday', 'sadaqah'];
type ModalMode = 'create' | 'edit' | null;

export default function RemindersPage() {
  const [reminders, setReminders] = useState<AdminReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editItem, setEditItem] = useState<AdminReminder | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminReminders({ type: filterType || undefined, status: filterStatus || undefined, size: 100 });
      setReminders(data.items);
    } catch (e) {
      setReminders([]);
      toast.error(e instanceof Error ? e.message : 'Could not load reminder workspace.');
    } finally { setLoading(false); }
  }, [filterType, filterStatus]);

  useEffect(() => { void load(); }, [load]);
  const openCreate = () => { setEditItem(null); setModalMode('create'); };
  const openEdit = (item: AdminReminder) => { setEditItem(item); setModalMode('edit'); };
  const closeModal = () => { setModalMode(null); setEditItem(null); };
  const handleSuccess = () => { closeModal(); void load(); };

  const handlePublish = async (item: AdminReminder) => {
    try {
      await publishReminder(item.id);
      toast.success(`${item.type === 'quran' ? 'Quran' : item.type === 'hadith' ? 'Hadith' : item.type === 'dua' ? "Du'a" : 'Reminder'} published and eligible opted-in users notified.`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Publish failed. Nothing was marked published.');
    }
  };

  const columns: Column<AdminReminder>[] = [
    { key: 'title', header: 'Content', render: (r) => <div><div className="font-medium text-gray-900">{r.title}</div>{r.arabic_text && <div className="text-xs text-gray-500 mt-0.5 font-arabic" dir="rtl">{r.arabic_text.slice(0, 70)}{r.arabic_text.length > 70 ? '…' : ''}</div>}{r.source_reference&&<div className="text-[11px] text-gray-400 mt-1">{r.source_reference}</div>}</div> },
    { key: 'type', header: 'Type', render: (r) => <span className="text-xs capitalize bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">{r.type}</span> },
    { key: 'status', header: 'Workflow', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'scheduled_for', header: 'Scheduled', render: (r) => r.scheduled_for ? <div className="inline-flex items-center gap-1 text-xs"><CalendarClock size={13}/>{formatDateTime(r.scheduled_for)}</div> : '—' },
    { key: 'created_at', header: 'Created', render: (r) => formatDate(r.created_at) },
    { key: 'actions', header: '', render: (r) => <div className="flex gap-1">{r.status !== 'published' && <button onClick={() => void handlePublish(r)} title="Publish now" className="p-1.5 rounded bg-green-50 text-green-600 hover:bg-green-100"><Send size={14} /></button>}<button onClick={() => openEdit(r)} title="Edit" className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"><Edit2 size={14} /></button></div> },
  ];

  return <AdminLayout title="Islamic & Motivation Content" subtitle="Draft, verify, schedule and publish Quran, Hadith, Du'a, motivation and Jumu'ah content.">
    <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900"><b>Content workflow:</b> Draft → human source/content review → Approved → schedule or Publish. Publishing sends a category-aware push only to users who opted into that content category.</div>
    <div className="flex flex-wrap items-center gap-3 mb-5"><div className="flex flex-wrap gap-2 flex-1"><button onClick={() => setFilterType('')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterType === '' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>All Types</button>{TYPES.map((t) => <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filterType === t ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{t === 'dua' ? "Du'a" : t}</button>)}</div><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input w-full sm:w-40"><option value="">All Statuses</option><option value="draft">Draft</option><option value="approved">Approved</option><option value="published">Published</option><option value="archived">Archived</option></select><button onClick={()=>void load()} disabled={loading} className="btn-secondary inline-flex items-center gap-2"><RefreshCw size={15} className={loading?'animate-spin':''}/>Refresh</button><button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} /> New Content</button></div>
    <div className="card overflow-hidden"><DataTable columns={columns} data={reminders} loading={loading} emptyMessage="No content matches this view." /></div>
    {modalMode && <div className="modal-shell"><div className="modal-panel"><h3 className="text-lg font-bold text-gray-900 mb-4">{modalMode === 'create' ? 'Create Content' : 'Edit Content'}</h3><ReminderForm initial={(editItem || undefined) as Reminder | undefined} onSuccess={handleSuccess} onCancel={closeModal} /></div></div>}
  </AdminLayout>;
}
