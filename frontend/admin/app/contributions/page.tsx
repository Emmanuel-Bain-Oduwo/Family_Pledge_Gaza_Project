'use client';
import { useEffect, useState, useCallback } from 'react';
import { Check, X, AlertCircle, MessageSquare, RefreshCw, Image as ImageIcon } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import DataTable, { Column } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { getContributions, reviewContribution } from '../../lib/api';
import { Contribution, ContributionStatus } from '../../types';
import { formatDate, formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function ContributionsPage() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [modalItem, setModalItem] = useState<Contribution | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [reviewAction, setReviewAction] = useState<ContributionStatus | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      const res = await getContributions(params);
      setContributions(res.data);
    } catch (e: any) {
      toast.error(e.message || 'Could not load contributions.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const openReview = (item: Contribution, action: ContributionStatus) => {
    setModalItem(item);
    setReviewAction(action);
    setAdminNote(item.admin_note || '');
  };

  const submitReview = async () => {
    if (!modalItem || !reviewAction) return;
    setReviewing(true);
    try {
      const updated = await reviewContribution(modalItem.id, { status: reviewAction, admin_note: adminNote });
      setContributions((prev) => prev.map((c) => c.id === updated.id ? { ...updated, donor_name: c.donor_name, donor_phone: c.donor_phone, user_id: c.user_id } : c));
      toast.success(`Marked as ${reviewAction.replace(/_/g, ' ')}.`);
      setModalItem(null);
    } catch (e: any) {
      toast.error(e.message || 'Could not update this contribution.');
    } finally {
      setReviewing(false);
    }
  };

  const columns: Column<Contribution>[] = [
    { key: 'donor_name', header: 'Donor', render: (c) => <div><div className="font-medium">{c.donor_name}</div><div className="text-xs text-gray-400">{c.month} {c.year}</div></div> },
    { key: 'amount', header: 'Amount', render: (c) => <span className="font-semibold">{formatCurrency(c.amount, c.currency)}</span> },
    { key: 'reference', header: 'Reference', render: (c) => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{c.reference}</span> },
    { key: 'payment_method', header: 'Method', render: (c) => <span className="text-xs capitalize">{c.payment_method.replace(/_/g, ' ')}</span> },
    { key: 'proof_url', header: 'Proof', render: (c) => c.proof_url ? <a href={c.proof_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><ImageIcon size={14} /> View screenshot</a> : <span className="text-xs text-gray-400">Message/reference</span> },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    { key: 'submitted_at', header: 'Submitted', render: (c) => formatDate(c.submitted_at) },
    {
      key: 'actions', header: 'Actions', render: (c) => (
        <div className="flex gap-1">
          {c.status !== 'confirmed' && (
            <button onClick={() => openReview(c, 'confirmed')} title="Confirm" className="p-1.5 rounded bg-green-50 text-green-600 hover:bg-green-100">
              <Check size={14} />
            </button>
          )}
          {c.status !== 'rejected' && (
            <button onClick={() => openReview(c, 'rejected')} title="Reject" className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100">
              <X size={14} />
            </button>
          )}
          {c.status !== 'needs_follow_up' && (
            <button onClick={() => openReview(c, 'needs_follow_up')} title="Needs follow-up" className="p-1.5 rounded bg-amber-50 text-amber-600 hover:bg-amber-100">
              <AlertCircle size={14} />
            </button>
          )}
          {c.admin_note && (
            <button onClick={() => { setModalItem(c); setAdminNote(c.admin_note || ''); setReviewAction(null); }} title="View note" className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100">
              <MessageSquare size={14} />
            </button>
          )}
        </div>
      )
    },
  ];

  const counts = {
    submitted: contributions.filter(c => c.status === 'submitted').length,
    confirmed: contributions.filter(c => c.status === 'confirmed').length,
    rejected: contributions.filter(c => c.status === 'rejected').length,
    needs_follow_up: contributions.filter(c => c.status === 'needs_follow_up').length,
  };

  return (
    <AdminLayout title="Contributions" subtitle="Review and manage contribution submissions">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center mb-5">
        {[
          { value: '', label: 'All' },
          { value: 'submitted', label: `Submitted (${counts.submitted})` },
          { value: 'confirmed', label: `Confirmed (${counts.confirmed})` },
          { value: 'rejected', label: `Rejected (${counts.rejected})` },
          { value: 'needs_follow_up', label: `Follow Up (${counts.needs_follow_up})` },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === f.value ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {f.label}
          </button>
        ))}
        <button onClick={load} disabled={loading} className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
        <span className="w-full text-right text-xs text-gray-400">Automatically refreshes every 30 seconds</span>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={contributions} loading={loading} />
      </div>

      {/* Review Modal */}
      {modalItem && (
        <div className="modal-shell">
          <div className="modal-panel max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {reviewAction ? `Mark as ${reviewAction.replace(/_/g, ' ')}` : 'Admin Note'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Ref: <span className="font-mono font-semibold">{modalItem.reference}</span> · {modalItem.donor_name}
            </p>

            {modalItem.proof_url && <a href={modalItem.proof_url} target="_blank" rel="noreferrer" className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-gray-200 p-3 text-sm font-semibold text-primary hover:bg-gray-50"><ImageIcon size={17} /> Open payment screenshot</a>}

            <div className="mb-4">
              <label className="label">Admin Note {reviewAction ? '(optional)' : ''}</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="input"
                rows={3}
                placeholder="Internal note for this decision…"
              />
            </div>

            {reviewAction && (
              <div className="modal-actions">
                <button onClick={submitReview} disabled={reviewing} className="btn-primary flex-1">
                  {reviewing ? 'Saving…' : `Confirm: ${reviewAction.replace(/_/g, ' ')}`}
                </button>
                <button onClick={() => setModalItem(null)} className="btn-ghost">Cancel</button>
              </div>
            )}
            {!reviewAction && (
              <button onClick={() => setModalItem(null)} className="btn-ghost w-full">Close</button>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
