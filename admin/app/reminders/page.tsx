'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Send } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import DataTable, { Column } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ReminderForm from '../../components/ReminderForm';
import { getReminders, publishReminder } from '../../lib/api';
import { Reminder, ReminderType } from '../../types';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

const MOCK: Reminder[] = [
  { id: 'r1', type: 'quran', title: 'Give in the cause of Allah', arabic_text: 'وَأَنفِقُوا فِي سَبِيلِ اللَّهِ', text: 'And spend in the cause of Allah and do not throw yourselves with your own hands into destruction.', translation: 'Al-Baqarah 2:195', status: 'published', created_at: '2025-06-08T08:00:00Z' },
  { id: 'r2', type: 'friday', title: 'Jumu\'ah Mubarak — Give Today', text: 'Friday is a blessed day. Take a moment today to confirm your monthly pledge and earn the reward of sadaqah jariyah.', status: 'approved', scheduled_date: '2025-06-13', created_at: '2025-06-07T10:00:00Z' },
  { id: 'r3', type: 'hadith', title: 'Shade of Charity on Judgement Day', arabic_text: 'كُلُّ امْرِئٍ فِي ظِلِّ صَدَقَتِهِ حَتَّى يُفْصَلَ بَيْنَ النَّاسِ', text: 'Every person will be in the shade of his charity on the Day of Resurrection until judgment is pronounced among the people.', source_reference: 'Ahmad, Al-Hākim', status: 'draft', created_at: '2025-06-05T14:00:00Z' },
  { id: 'r4', type: 'sadaqah', title: 'Your $10 = A Family Fed', text: 'This month\'s $10 pledge helped feed a family of 5 in Gaza for a week. Your sadaqah is working. Keep going.', status: 'published', created_at: '2025-06-01T09:00:00Z' },
];

const TYPES: ReminderType[] = ['quran', 'hadith', 'dua', 'motivation', 'friday', 'sadaqah'];

type ModalMode = 'create' | 'edit' | null;

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editItem, setEditItem] = useState<Reminder | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;
      const data = await getReminders(params);
      setReminders(data);
    } catch {
      let filtered = MOCK;
      if (filterType) filtered = filtered.filter((r) => r.type === filterType);
      if (filterStatus) filtered = filtered.filter((r) => r.status === filterStatus);
      setReminders(filtered);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setModalMode('create'); };
  const openEdit = (item: Reminder) => { setEditItem(item); setModalMode('edit'); };
  const closeModal = () => { setModalMode(null); setEditItem(null); };

  const handleSuccess = (saved: Reminder) => {
    if (modalMode === 'create') {
      setReminders((prev) => [saved, ...prev]);
    } else {
      setReminders((prev) => prev.map((r) => r.id === saved.id ? saved : r));
    }
    closeModal();
  };

  const handlePublish = async (item: Reminder) => {
    try {
      const updated = await publishReminder(item.id);
      setReminders((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    } catch {
      setReminders((prev) => prev.map((r) => r.id === item.id ? { ...r, status: 'published' } : r));
    }
    toast.success('Reminder published to app.');
  };

  const columns: Column<Reminder>[] = [
    {
      key: 'title', header: 'Reminder', render: (r) => (
        <div>
          <div className="font-medium text-gray-900">{r.title}</div>
          {r.arabic_text && <div className="text-xs text-gray-500 mt-0.5 font-arabic" dir="rtl">{r.arabic_text.slice(0, 50)}{r.arabic_text.length > 50 ? '…' : ''}</div>}
        </div>
      )
    },
    { key: 'type', header: 'Type', render: (r) => <span className="text-xs capitalize bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">{r.type}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'scheduled_date', header: 'Scheduled', render: (r) => r.scheduled_date ? formatDate(r.scheduled_date) : '—' },
    { key: 'created_at', header: 'Created', render: (r) => formatDate(r.created_at) },
    {
      key: 'actions', header: '', render: (r) => (
        <div className="flex gap-1">
          {r.status !== 'published' && (
            <button onClick={() => handlePublish(r)} title="Publish" className="p-1.5 rounded bg-green-50 text-green-600 hover:bg-green-100"><Send size={14} /></button>
          )}
          <button onClick={() => openEdit(r)} className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"><Edit2 size={14} /></button>
        </div>
      )
    },
  ];

  return (
    <AdminLayout title="Reminders" subtitle="Islamic reminders and motivational content for donors">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex flex-wrap gap-2 flex-1">
          <button onClick={() => setFilterType('')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterType === '' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>All Types</button>
          {TYPES.map((t) => (
            <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filterType === t ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{t}</button>
          ))}
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input w-36">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Reminder
        </button>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={reminders} loading={loading} />
      </div>

      {modalMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl my-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{modalMode === 'create' ? 'Create Reminder' : 'Edit Reminder'}</h3>
            <ReminderForm initial={editItem || undefined} onSuccess={handleSuccess} onCancel={closeModal} />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
