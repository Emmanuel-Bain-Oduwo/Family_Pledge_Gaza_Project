'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import { listFeatureRequests, updateFeatureRequestStatus, type FeatureRequestItem } from '../../lib/featureRequestsApi';

const STATUSES: FeatureRequestItem['status'][] = ['new', 'reviewing', 'planned', 'completed', 'declined'];

export default function FeatureRequestsPage() {
  const [items, setItems] = useState<FeatureRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    try { setItems(await listFeatureRequests()); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not load feature requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const setStatus = async (item: FeatureRequestItem, status: FeatureRequestItem['status']) => {
    setBusy(item.id);
    try {
      const updated = await updateFeatureRequestStatus(item.id, status);
      setItems((current) => current.map((entry) => entry.id === item.id ? updated : entry));
      toast.success(`Request marked ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update request');
    } finally { setBusy(null); }
  };

  return (
    <AdminLayout title="Feature Requests" subtitle="Review ideas submitted by Family Pledge users">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{items.length} request{items.length === 1 ? '' : 's'}</p>
        <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={() => { setLoading(true); void load(); }}><RefreshCw size={15} /> Refresh</button>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-gray-400">Loading feature requests…</div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center"><Lightbulb className="mx-auto mb-3 text-gray-300" size={32} /><p className="text-gray-500">No feature requests yet.</p></div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-gray-900">{item.title}</h2>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold capitalize text-gray-600">{item.status}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">{item.description}</p>
                  <p className="mt-3 text-xs text-gray-400">Submitted {new Date(item.created_at).toLocaleString()}</p>
                </div>
                <select
                  aria-label={`Status for ${item.title}`}
                  disabled={busy === item.id}
                  value={item.status}
                  onChange={(event) => void setStatus(item, event.target.value as FeatureRequestItem['status'])}
                  className="input min-w-[150px] sm:w-auto"
                >
                  {STATUSES.map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
