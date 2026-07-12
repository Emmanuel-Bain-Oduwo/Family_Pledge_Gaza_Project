'use client';
import { useEffect, useState } from 'react';
import { Copy, ChevronDown, ChevronUp, Users } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import StatCard from '../../components/StatCard';
import { getCollectors, getCollectorMembers } from '../../lib/api';
import { Collector, CollectorMember } from '../../types';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

const MOCK_COLLECTORS: Collector[] = [
  { id: 'col1', user_id: 'u1', collector_code: 'FP-AHMED', name: 'Ahmed Hassan', phone: '+254700001', country: 'Kenya', total_registered: 24, contributed_this_month: 18, pending_this_month: 6, created_at: '2024-01-15T10:00:00Z' },
  { id: 'col2', user_id: 'u2', collector_code: 'FP-SARAH', name: 'Sarah Al-Ameen', phone: '+254700002', country: 'Kenya', total_registered: 31, contributed_this_month: 27, pending_this_month: 4, created_at: '2024-02-01T10:00:00Z' },
  { id: 'col3', user_id: 'u3', collector_code: 'FP-OMAR', name: 'Omar Khalif', phone: '+255700003', country: 'Tanzania', total_registered: 15, contributed_this_month: 11, pending_this_month: 4, created_at: '2024-03-10T10:00:00Z' },
  { id: 'col4', user_id: 'u4', collector_code: 'FP-NURU', name: 'Nuru Abdallah', phone: '+256700004', country: 'Uganda', total_registered: 9, contributed_this_month: 7, pending_this_month: 2, created_at: '2024-04-05T10:00:00Z' },
];

const MOCK_MEMBERS: CollectorMember[] = [
  { id: 'm1', donor_id: 'd1', display_name: 'Fatima Noor', pledge_status: 'paid', joined_at: '2024-02-01T10:00:00Z' },
  { id: 'm2', donor_id: 'd2', display_name: 'Yusuf Omar', pledge_status: 'pending', joined_at: '2024-03-15T10:00:00Z' },
  { id: 'm3', donor_id: 'd3', display_name: 'Maryam Said', pledge_status: 'missed', joined_at: '2024-04-01T10:00:00Z' },
];

const STATUS_DOT: Record<string, string> = {
  paid: 'bg-green-500',
  pending: 'bg-amber-400',
  missed: 'bg-red-400',
  free_participant: 'bg-blue-400',
  none: 'bg-gray-300',
};

export default function CollectorsPage() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [membersMap, setMembersMap] = useState<Record<string, CollectorMember[]>>({});
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    getCollectors()
      .then(setCollectors)
      .catch(() => setCollectors(MOCK_COLLECTORS))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (membersMap[id]) return;
    setMembersLoading(true);
    try {
      const members = await getCollectorMembers(id);
      setMembersMap((prev) => ({ ...prev, [id]: members }));
    } catch {
      setMembersMap((prev) => ({ ...prev, [id]: MOCK_MEMBERS }));
    } finally {
      setMembersLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => toast.success('Code copied!'));
  };

  const totalRegistered = collectors.reduce((s, c) => s + c.total_registered, 0);
  const totalContributed = collectors.reduce((s, c) => s + c.contributed_this_month, 0);

  return (
    <AdminLayout title="Collectors" subtitle="Manage community collectors and their pledge circles">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Collectors" value={collectors.length} icon={Users} color="green" />
        <StatCard label="Total Registered" value={totalRegistered} icon={Users} color="blue" />
        <StatCard label="Paid This Month" value={totalContributed} icon={Users} color="green" />
        <StatCard label="Avg Circle Size" value={collectors.length ? Math.round(totalRegistered / collectors.length) : 0} icon={Users} color="purple" />
      </div>

      <div className="card overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Collector</th>
                <th className="table-th">Code</th>
                <th className="table-th">Total</th>
                <th className="table-th">This Month</th>
                <th className="table-th">Since</th>
                <th className="table-th">Circle</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="table-td text-center py-12 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Loading…
                  </div>
                </td></tr>
              ) : collectors.map((c) => (
                <>
                  <tr key={c.id} className="table-row">
                    <td className="table-td">
                      <div className="font-medium text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.country}</div>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{c.collector_code}</span>
                        <button onClick={() => copyCode(c.collector_code)} className="p-1 text-gray-400 hover:text-gray-600"><Copy size={12} /></button>
                      </div>
                    </td>
                    <td className="table-td font-semibold">{c.total_registered}</td>
                    <td className="table-td">
                      <span className="text-green-700 font-semibold">{c.contributed_this_month}</span>
                      <span className="text-gray-400 text-xs"> paid</span>
                      {c.pending_this_month > 0 && <span className="ml-1 text-amber-600 text-xs">{c.pending_this_month} pending</span>}
                    </td>
                    <td className="table-td">{formatDate(c.created_at)}</td>
                    <td className="table-td">
                      <button onClick={() => toggleExpand(c.id)} className="p-1.5 rounded bg-gray-50 text-gray-500 hover:bg-gray-100 flex items-center gap-1 text-xs">
                        <Users size={14} /> {expanded === c.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </td>
                  </tr>
                  {expanded === c.id && (
                    <tr key={`${c.id}-expanded`}>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="text-xs font-semibold text-gray-500 mb-2">Circle Members ({membersMap[c.id]?.length ?? '…'})</div>
                        {membersLoading && !membersMap[c.id] ? (
                          <div className="text-xs text-gray-400">Loading members…</div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {(membersMap[c.id] || []).map((m) => (
                              <div key={m.id} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[m.pledge_status] || 'bg-gray-300'}`} />
                                <span className="text-xs text-gray-700">{m.display_name}</span>
                                <span className="text-xs text-gray-400 capitalize">{m.pledge_status.replace(/_/g, ' ')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
