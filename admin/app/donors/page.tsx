'use client';
import { useEffect, useState, useCallback } from 'react';
import { Search, Users } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import DataTable, { Column } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { getDonors } from '../../lib/api';
import { Donor } from '../../types';
import { formatDate } from '../../lib/utils';

const MOCK_DONORS: Donor[] = [
  { id: '1', full_name: 'Ahmed Hassan', nickname: 'Abu Yusuf', phone: '+254700001', country: 'Kenya', anonymous_publicly: false, is_collector: true, pledge_status: 'paid', donor_number: 42, created_at: '2024-01-10T10:00:00Z' },
  { id: '2', full_name: 'Fatima Noor', phone: '+254700002', country: 'Kenya', city: 'Mombasa', anonymous_publicly: true, is_collector: false, pledge_status: 'pending', donor_number: 87, created_at: '2024-02-15T10:00:00Z' },
  { id: '3', full_name: 'Ibrahim Omar', phone: '+255700003', country: 'Tanzania', anonymous_publicly: false, is_collector: false, pledge_status: 'missed', donor_number: 103, created_at: '2024-03-01T10:00:00Z' },
  { id: '4', full_name: 'Maryam Said', phone: '+256700004', country: 'Uganda', anonymous_publicly: false, is_collector: false, pledge_status: 'paid', donor_number: 156, created_at: '2024-03-20T10:00:00Z' },
  { id: '5', full_name: 'Yusuf Khalid', phone: '+254700005', country: 'Kenya', city: 'Nairobi', anonymous_publicly: false, is_collector: true, pledge_status: 'free_participant', created_at: '2024-04-05T10:00:00Z' },
];

export default function DonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterCountry) params.country = filterCountry;
      if (filterStatus) params.status = filterStatus;
      const res = await getDonors(params);
      setDonors(res.data);
    } catch {
      setDonors(MOCK_DONORS);
    } finally {
      setLoading(false);
    }
  }, [search, filterCountry, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const columns: Column<Donor>[] = [
    { key: 'donor_number', header: '#', render: (d) => d.donor_number ? `#${d.donor_number}` : '—' },
    {
      key: 'full_name', header: 'Donor', render: (d) => (
        <div>
          <div className="font-medium text-gray-900">{d.anonymous_publicly ? '(Anonymous)' : d.full_name}</div>
          {d.nickname && <div className="text-xs text-gray-400">{d.nickname}</div>}
        </div>
      )
    },
    { key: 'country', header: 'Country', render: (d) => `${d.city ? d.city + ', ' : ''}${d.country}` },
    { key: 'pledge_status', header: 'Pledge', render: (d) => <StatusBadge status={d.pledge_status} /> },
    { key: 'is_collector', header: 'Collector', render: (d) => d.is_collector ? <span className="text-primary font-semibold text-xs">Yes</span> : <span className="text-gray-400 text-xs">No</span> },
    { key: 'anonymous_publicly', header: 'Anon', render: (d) => d.anonymous_publicly ? <span className="text-amber-600 text-xs font-medium">Yes</span> : <span className="text-gray-400 text-xs">No</span> },
    { key: 'created_at', header: 'Joined', render: (d) => formatDate(d.created_at) },
  ];

  const countries = [...new Set(MOCK_DONORS.map((d) => d.country))];

  return (
    <AdminLayout title="Donors" subtitle={`${donors.length} registered donors`}>
      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone…"
            className="input pl-9"
          />
        </div>
        <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} className="input w-40">
          <option value="">All Countries</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input w-44">
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="missed">Missed</option>
          <option value="free_participant">Free Participant</option>
        </select>
        <button onClick={load} className="btn-secondary">Filter</button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={donors} loading={loading} emptyMessage="No donors found." />
      </div>

      <div className="mt-3 text-xs text-gray-400 text-right">
        Showing {donors.length} donors · Phone numbers are not displayed for privacy.
      </div>
    </AdminLayout>
  );
}
