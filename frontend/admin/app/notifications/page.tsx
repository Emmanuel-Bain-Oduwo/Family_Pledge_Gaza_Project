'use client';
import { useEffect, useState } from 'react';
import { Bell, Send, Users, Clock } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import NotificationForm from '../../components/NotificationForm';
import { getNotifications, sendNotification } from '../../lib/api';
import { PushNotification } from '../../types';
import { formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';

const MOCK: PushNotification[] = [
  { id: 'pn1', title: 'June Pledge Reminder', body: 'Assalamu Alaykum! Your June pledge is due. JazakAllah Khayr for your continued support of Gaza.', notification_type: 'reminder', audience: 'pending_donors', sent_count: 234, sent_at: '2025-06-05T09:00:00Z', sent_by: 'Admin' },
  { id: 'pn2', title: 'Friday Challenge — 58 spots left!', body: 'We\'re 142/200 donors for this Friday\'s challenge. Invite someone today and earn the reward of Jumu\'ah sadaqah.', notification_type: 'campaign', audience: 'all_users', sent_count: 1247, sent_at: '2025-06-06T07:30:00Z', sent_by: 'Admin' },
  { id: 'pn3', title: 'Impact Update: Water Well Completed', body: 'Your donations built a water purification unit serving 200 families in Northern Gaza. May Allah accept it.', notification_type: 'impact', audience: 'confirmed_donors', sent_count: 893, sent_at: '2025-05-22T10:00:00Z', sent_by: 'Admin' },
  { id: 'pn4', title: 'Collector Circle Update', body: 'Your circle has 18/24 members confirmed for June. Please follow up with remaining members.', notification_type: 'system', audience: 'collectors', sent_count: 38, sent_at: '2025-06-04T11:00:00Z', sent_by: 'Admin' },
];

const AUDIENCE_LABELS: Record<string, string> = {
  all_users: 'All Users',
  pending_donors: 'Pending Donors',
  confirmed_donors: 'Confirmed Donors',
  collectors: 'Collectors',
  admins: 'Admins Only',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(() => setNotifications(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async (values: { title: string; body: string; notification_type: string; audience: string }) => {
    setSending(true);
    try {
      const sent = await sendNotification(values);
      setNotifications((prev) => [sent, ...prev]);
      toast.success(`Notification sent to ${AUDIENCE_LABELS[values.audience] || values.audience}.`);
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to send notification. No users were notified.');
    } finally {
      setSending(false);
    }
  };

  const totalSent = notifications.reduce((s, n) => s + (n.sent_count || 0), 0);

  return (
    <AdminLayout title="Push Notifications" subtitle="Send targeted push notifications to donors and collectors">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Bell size={20} className="text-primary" /></div>
          <div><div className="text-2xl font-bold text-gray-900">{notifications.length}</div><div className="text-xs text-gray-500">Notifications Sent</div></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Users size={20} className="text-blue-600" /></div>
          <div><div className="text-2xl font-bold text-gray-900">{totalSent.toLocaleString()}</div><div className="text-xs text-gray-500">Total Deliveries</div></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Clock size={20} className="text-amber-600" /></div>
          <div><div className="text-2xl font-bold text-gray-900">{notifications[0] ? new Date(notifications[0].sent_at).toLocaleDateString() : '—'}</div><div className="text-xs text-gray-500">Last Sent</div></div>
        </div>
      </div>

      {/* Compose button */}
      {!showForm && (
        <div className="mb-5">
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Send size={16} /> Compose Notification
          </button>
        </div>
      )}

      {/* Compose form */}
      {showForm && (
        <div className="card p-6 mb-5 border-2 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><Send size={16} className="text-primary" /> New Push Notification</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
          </div>
          <NotificationForm onSubmit={handleSend} loading={sending} />
        </div>
      )}

      {/* History */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">Notification History</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="card p-4 h-20 animate-pulse bg-gray-100" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{n.title}</span>
                      <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary-dark rounded font-medium capitalize">{n.notification_type}</span>
                      <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded font-medium">{AUDIENCE_LABELS[n.audience] || n.audience}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{n.body}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {n.sent_count !== undefined && (
                      <div className="text-sm font-semibold text-gray-900">{n.sent_count.toLocaleString()}</div>
                    )}
                    <div className="text-xs text-gray-400">{formatDateTime(n.sent_at)}</div>
                  </div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="card p-10 text-center text-gray-400">No notifications sent yet.</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
