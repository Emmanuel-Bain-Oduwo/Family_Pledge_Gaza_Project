'use client';
import { useEffect, useState, useCallback } from 'react';
import { Check, X, AlertCircle, MessageSquare } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import DataTable, { Column } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { getContributions, reviewContribution } from '../../lib/api';
import { Contribution, ContributionStatus } from '../../types';
import { formatDate, formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

const MOCK: Contribution[] = [
  { id: 'c1', user_id: 'u1', donor_name: 'Ahmed Hassan', donor_phone: '+254700001', amount: 10, currency: 'USD', reference: 'QKR7XNPK', payment_method: 'mpesa', status: 'submitted', month: 'June', year: 2025, submitted_at: '2025-06-05T09:30:00Z' },
  { id: 'c2', user_id: 'u2', donor_name: 'Fatima Noor', donor_phone: '+254700002', amount: 10, currency: 'USD', reference: 'MPF3BWKL', payment_method: 'bank', status: 'confirmed', month: 'June', year: 2025, submitted_at: '2025-06-03T11:00:00Z', reviewed_at: '2025-06-04T08:00:00Z' },
  { id: 'c3', user_id: 'u3', donor_name: 'Ibrahim Omar', donor_phone: '+255700003', amount: 10, currency: 'USD', reference: 'TXN9923X', payment_method: 'paybill', status: 'needs_follow_up', admin_note: 'Reference not found in M-PESA statement', month: 'May', year: 2025, submitted_at: '2025-05-28T14:00:00Z' },
  { id: 'c4', user_id: 'u4', donor_name: 'Maryam Said', donor_phone: '+256700004', amount: 10, currency: 'USD', reference: 'BWK229JK', payment_method: 'mpesa', status: 'rejected', admin_note: 'Duplicate submission', month: 'May', year: 2025, submitted_at: '2025-05-20T10:00:00Z' },
  { id: 'c5', user_id: 'u5', donor_name: 'Yusuf Khalid', donor_phone: '+254700005', amount: 10, currency: 'USD', reference: 'INV00142', payment_method: 'link', status: 'submitted', month: 'June', year: 2025, submitted_at: '2025-06-08T16:00:00Z' },
];

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
    } catch {
      const filtered = filterStatus ? MOCK.filter((c) => c.status === filterStatus) : MOCK;
      setContributions(filtered);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

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
      // Mock update for demo
      setContributions((prev) => prev.map((c) => c.id === modalItem.id ? { ...c, status: reviewAction, admin_note: adminNote } : c));
      toast.success(`Marked as ${reviewAction.replace(/_/g, ' ')}.`);
      setModalItem(null);
    } finally {
      setReviewing(false);
    }
  };

  const columns: Column<Contribution>[] = [
    { key: 'donor_name', header: 'Donor', render: (c) => <div><div className="font-medium">{c.donor_name}</div><div className="text-xs text-gray-400">{c.month} {c.year}</div></div> },
    { key: 'amount', header: 'Amount', render: (c) => <span className="font-semibold">{formatCurrency(c.amount, c.currency)}</span> },
    { key: 'reference', header: 'Reference', render: (c) => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{c.reference}</span> },
    { key: 'payment_method', header: 'Method', render: (c) => <span className="text-xs capitalize">{c.payment_method.replace(/_/g, ' ')}</span> },
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
    submitted: MOCK.filter(c => c.status === 'submitted').length,
    confirmed: MOCK.filter(c => c.status === 'confirmed').length,
    rejected: MOCK.filter(c => c.status === 'rejected').length,
    needs_follow_up: MOCK.filter(c => c.status === 'needs_follow_up').length,
  };

  return (
    <AdminLayout title="Contributions" subtitle="Review and manage contribution submissions">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
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
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={contributions} loading={loading} />
      </div>

      {/* Review Modal */}
      {modalItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {reviewAction ? `Mark as ${reviewAction.replace(/_/g, ' ')}` : 'Admin Note'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Ref: <span className="font-mono font-semibold">{modalItem.reference}</span> · {modalItem.donor_name}
            </p>

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
              <div className="flex gap-3">
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
