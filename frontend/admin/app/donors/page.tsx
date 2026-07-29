'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import DataTable, { Column } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { createTrackedContact, getDonors, getTrackedContacts } from '../../lib/api';
import { Donor, TrackedContact } from '../../types';
import { formatDate } from '../../lib/utils';

export default function DonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [tracked, setTracked] = useState<TrackedContact[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({full_name:'',phone:'',email:'',country:'',status:'following_up' as const,notes:''});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterCountry) params.country = filterCountry;
      if (filterStatus) params.status = filterStatus;
      const [res, contacts] = await Promise.all([getDonors(params), getTrackedContacts()]);
      setDonors(res.data);
      setTracked(contacts);
    } catch {
      setDonors([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterCountry, filterStatus]);

  useEffect(() => { load(); }, [load]);
  const addTracked = async (e: React.FormEvent) => { e.preventDefault(); const c=await createTrackedContact(form); setTracked(v=>[c,...v]); setShowAdd(false); setForm({full_name:'',phone:'',email:'',country:'',status:'following_up',notes:''}); };

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

  const countries = Array.from(new Set(donors.map((d) => d.country).filter(Boolean)));

  return (
    <AdminLayout title="Donors" subtitle={`${donors.length} registered donors`}>
      <div className="card p-5 mb-5"><div className="flex justify-between gap-3 mb-4"><div><h2 className="font-bold">Follow-up register</h2><p className="text-sm text-gray-500">Track people securely without notebooks or spreadsheets.</p></div><button className="btn-primary flex gap-2 items-center" onClick={()=>setShowAdd(!showAdd)}><Plus size={16}/>Add person</button></div>
      {showAdd&&<form onSubmit={addTracked} className="grid md:grid-cols-3 gap-3 mb-4"><input required className="input" placeholder="Full name" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/><input className="input" placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input className="input" type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input className="input" placeholder="Country" value={form.country} onChange={e=>setForm({...form,country:e.target.value})}/><select className="input" value={form.status} onChange={e=>setForm({...form,status:e.target.value as typeof form.status})}><option value="following_up">Following up</option><option value="pledged">Pledged</option><option value="paid">Paid</option><option value="paused">Paused</option></select><input className="input" placeholder="Private notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/><button className="btn-primary md:col-span-3">Save person</button></form>}
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b"><th>Name</th><th>Contact</th><th>Status</th><th>Notes</th></tr></thead><tbody>{tracked.map(c=><tr className="border-b" key={c.id}><td className="py-3 font-medium">{c.full_name}</td><td>{c.phone||c.email||'—'}</td><td><StatusBadge status={c.status}/></td><td>{c.notes||'—'}</td></tr>)}</tbody></table>{!tracked.length&&<p className="text-center py-5 text-gray-500">No tracked people yet.</p>}</div></div>
      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-full sm:min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone…"
            className="input pl-9"
          />
        </div>
        <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} className="input w-full sm:w-40">
          <option value="">All Countries</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input w-full sm:w-44">
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
