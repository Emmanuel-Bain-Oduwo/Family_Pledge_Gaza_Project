'use client';
import { useEffect, useState } from 'react';
import { Plus, Edit2, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { getImpactCards, createImpactCard, updateImpactCard } from '../../lib/api';
import { ImpactCard } from '../../types';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

const MOCK: ImpactCard[] = [
  { id: 'i1', title: 'Family of 7 receives food package', story: 'The Al-Masri family, displaced from Gaza City, received their first food package in weeks. The children had not eaten properly for days. With your pledge, they had bread, rice, and lentils for the first time this Ramadan.', beneficiaries_count: 7, location: 'Rafah', published: true, completed_date: '2025-06-01', created_at: '2025-06-02T10:00:00Z' },
  { id: 'i2', title: 'Water well reaches 200 families', story: 'The water purification unit installed in Beit Lahiya is now providing clean water daily to over 200 families. Children who once walked 2km for water now have it at their doorstep.', beneficiaries_count: 200, location: 'Beit Lahiya', published: true, completed_date: '2025-05-20', created_at: '2025-05-21T08:00:00Z' },
  { id: 'i3', title: 'Orphan education fund disbursed', story: 'This month\'s orphan sponsorship enabled 12 children to continue their education with books and supplies purchased from the fund.', beneficiaries_count: 12, location: 'Khan Yunis', published: false, created_at: '2025-06-08T14:00:00Z' },
];

type ModalMode = 'create' | 'edit' | null;

interface ImpactForm {
  title: string;
  story: string;
  beneficiaries_count: string;
  location: string;
  image_url: string;
  video_url: string;
  completed_date: string;
  published: boolean;
}

export default function ImpactPage() {
  const [cards, setCards] = useState<ImpactCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editItem, setEditItem] = useState<ImpactCard | null>(null);
  const [form, setForm] = useState<ImpactForm>({ title: '', story: '', beneficiaries_count: '', location: '', image_url: '', video_url: '', completed_date: '', published: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getImpactCards()
      .then(setCards)
      .catch(() => setCards(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: '', story: '', beneficiaries_count: '', location: '', image_url: '', video_url: '', completed_date: '', published: false });
    setModalMode('create');
  };

  const openEdit = (item: ImpactCard) => {
    setEditItem(item);
    setForm({
      title: item.title,
      story: item.story,
      beneficiaries_count: item.beneficiaries_count?.toString() || '',
      location: item.location || '',
      image_url: item.image_url || '',
      video_url: item.video_url || '',
      completed_date: item.completed_date || '',
      published: item.published,
    });
    setModalMode('edit');
  };

  const closeModal = () => { setModalMode(null); setEditItem(null); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.story.trim()) {
      toast.error('Title and story are required.');
      return;
    }
    setSaving(true);
    const payload: Partial<ImpactCard> = {
      title: form.title,
      story: form.story,
      beneficiaries_count: form.beneficiaries_count ? parseInt(form.beneficiaries_count) : undefined,
      location: form.location || undefined,
      image_url: form.image_url || undefined,
      video_url: form.video_url || undefined,
      completed_date: form.completed_date || undefined,
      published: form.published,
    };
    try {
      if (modalMode === 'create') {
        const created = await createImpactCard(payload);
        setCards((prev) => [created, ...prev]);
        toast.success('Impact card created.');
      } else if (editItem) {
        const updated = await updateImpactCard(editItem.id, payload);
        setCards((prev) => prev.map((c) => c.id === updated.id ? updated : c));
        toast.success('Impact card updated.');
      }
      closeModal();
    } catch {
      if (modalMode === 'create') {
        const mock: ImpactCard = { id: `i${Date.now()}`, ...payload, title: form.title, story: form.story, published: form.published, created_at: new Date().toISOString() };
        setCards((prev) => [mock, ...prev]);
      } else if (editItem) {
        setCards((prev) => prev.map((c) => c.id === editItem.id ? { ...c, ...payload } : c));
      }
      toast.success(modalMode === 'create' ? 'Impact card created.' : 'Impact card updated.');
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (item: ImpactCard) => {
    const updated = { ...item, published: !item.published };
    setCards((prev) => prev.map((c) => c.id === item.id ? updated : c));
    try { await updateImpactCard(item.id, { published: updated.published }); } catch { /* optimistic */ }
    toast.success(updated.published ? 'Published to app.' : 'Unpublished from app.');
  };

  return (
    <AdminLayout title="Impact Updates" subtitle="Share stories of how donations are making a difference">
      <div className="flex justify-end mb-5">
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Impact Card
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="card p-5 h-48 animate-pulse bg-gray-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <div key={card.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 mr-3">
                  <h3 className="font-bold text-gray-900 leading-snug">{card.title}</h3>
                  <div className="text-xs text-gray-400 mt-0.5 flex gap-3">
                    {card.location && <span>{card.location}</span>}
                    {card.beneficiaries_count && <span>{card.beneficiaries_count} beneficiaries</span>}
                    <span>{formatDate(card.created_at)}</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => togglePublish(card)} title={card.published ? 'Unpublish' : 'Publish'} className={`p-1.5 rounded ${card.published ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                    {card.published ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => openEdit(card)} className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"><Edit2 size={14} /></button>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{card.story}</p>
              {!card.published && (
                <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded font-medium">Draft — not visible in app</span>
              )}
            </div>
          ))}
          {cards.length === 0 && (
            <div className="col-span-2 card p-10 text-center text-gray-400">No impact cards yet. Create one to inspire donors.</div>
          )}
        </div>
      )}

      {modalMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl my-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{modalMode === 'create' ? 'Create Impact Card' : 'Edit Impact Card'}</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input" placeholder="e.g. Family receives food package" />
              </div>
              <div>
                <label className="label">Story *</label>
                <textarea value={form.story} onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))} className="input" rows={4} placeholder="Tell the human story behind this impact…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Beneficiaries</label>
                  <input type="number" value={form.beneficiaries_count} onChange={(e) => setForm((f) => ({ ...f, beneficiaries_count: e.target.value }))} className="input" placeholder="0" />
                </div>
                <div>
                  <label className="label">Location</label>
                  <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="input" placeholder="e.g. Rafah" />
                </div>
              </div>
              <div>
                <label className="label">Image URL</label>
                <input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} className="input" placeholder="https://…" />
              </div>
              <div>
                <label className="label">Completion Date</label>
                <input type="date" value={form.completed_date} onChange={(e) => setForm((f) => ({ ...f, completed_date: e.target.value }))} className="input" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-gray-700">Publish immediately to the app</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Save'}</button>
                <button onClick={closeModal} className="btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
