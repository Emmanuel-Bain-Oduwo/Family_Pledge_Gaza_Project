'use client';
import { useEffect, useState } from 'react';
import { Sparkles, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import AiDraftCard from '../../components/AiDraftCard';
import {
  generateReminderDraft,
  generateImpactDraft,
  generateWeeklySummary,
  generateCollectorMessage,
  getAiDrafts,
  AiReminderPayload,
  AiImpactPayload,
  AiCollectorPayload,
} from '../../lib/api';
import { AiDraft, AiDraftStatus, AiDraftType } from '../../types';
import toast from 'react-hot-toast';

type ToneOption = 'warm' | 'formal' | 'concise' | 'motivational';

// ── Reminder form ─────────────────────────────────────────────────────────────

function ReminderForm({ onGenerated }: { onGenerated: (d: AiDraft) => void }) {
  const [form, setForm] = useState<AiReminderPayload>({
    audience: 'donors', tone: 'warm', language: 'English', key_points: [],
  });
  const [keyPointInput, setKeyPointInput] = useState('');
  const [busy, setBusy] = useState(false);

  const addKP = () => {
    const t = keyPointInput.trim();
    if (!t) return;
    setForm((f) => ({ ...f, key_points: [...(f.key_points || []), t] }));
    setKeyPointInput('');
  };
  const removeKP = (i: number) =>
    setForm((f) => ({ ...f, key_points: f.key_points?.filter((_, idx) => idx !== i) }));

  const submit = async () => {
    setBusy(true);
    try {
      const draft = await generateReminderDraft(form);
      onGenerated(draft);
      toast.success('Reminder draft generated — please review before use.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Audience</label>
          <input className="input" value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))} placeholder="e.g. donors, collectors" />
        </div>
        <div>
          <label className="label">Tone</label>
          <select className="input" value={form.tone} onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value as ToneOption }))}>
            {(['warm', 'formal', 'concise', 'motivational'] as ToneOption[]).map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Campaign title (optional)</label>
          <input className="input" value={form.campaign_title || ''} onChange={(e) => setForm((f) => ({ ...f, campaign_title: e.target.value || undefined }))} placeholder="e.g. Ramadan Relief 2025" />
        </div>
        <div>
          <label className="label">Language</label>
          <input className="input" value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} placeholder="English" />
        </div>
      </div>
      <div>
        <label className="label">Donor progress context (optional)</label>
        <input className="input" value={form.donor_progress || ''} onChange={(e) => setForm((f) => ({ ...f, donor_progress: e.target.value || undefined }))} placeholder="e.g. 72 of 200 donors confirmed this month" />
      </div>
      <div>
        <label className="label">Key points to include</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input className="input flex-1 min-w-0" value={keyPointInput} onChange={(e) => setKeyPointInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKP(); } }}
            placeholder="Add a key point and press Enter" />
          <button type="button" onClick={addKP} className="btn-secondary">Add</button>
        </div>
        {(form.key_points || []).length > 0 && (
          <ul className="mt-2 space-y-1">
            {form.key_points!.map((p, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded px-2 py-1">
                <span className="flex-1">• {p}</span>
                <button onClick={() => removeKP(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button onClick={submit} disabled={busy} className="btn-primary flex items-center gap-2 w-full justify-center">
        {busy ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</> : <><Sparkles size={14} />Generate Reminder Draft</>}
      </button>
    </div>
  );
}

// ── Impact update form ────────────────────────────────────────────────────────

function ImpactForm({ onGenerated }: { onGenerated: (d: AiDraft) => void }) {
  const [form, setForm] = useState<AiImpactPayload>({ project_title: '', tone: 'warm', language: 'English', verified_facts: [] });
  const [factInput, setFactInput] = useState('');
  const [busy, setBusy] = useState(false);

  const addFact = () => {
    const t = factInput.trim();
    if (!t) return;
    setForm((f) => ({ ...f, verified_facts: [...(f.verified_facts || []), t] }));
    setFactInput('');
  };
  const removeFact = (i: number) => setForm((f) => ({ ...f, verified_facts: f.verified_facts?.filter((_, idx) => idx !== i) }));

  const submit = async () => {
    if (!form.project_title.trim()) { toast.error('Project title is required'); return; }
    setBusy(true);
    try {
      const draft = await generateImpactDraft(form);
      onGenerated(draft);
      toast.success('Impact update draft generated — please review before use.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Project title *</label>
          <input className="input" value={form.project_title} onChange={(e) => setForm((f) => ({ ...f, project_title: e.target.value }))} placeholder="e.g. Gaza Food Package Drive" />
        </div>
        <div>
          <label className="label">Category (optional)</label>
          <input className="input" value={form.category || ''} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value || undefined }))} placeholder="e.g. food, water, orphans" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Beneficiaries reached (optional)</label>
          <input type="number" className="input" value={form.beneficiaries_count ?? ''} onChange={(e) => setForm((f) => ({ ...f, beneficiaries_count: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="e.g. 500" />
        </div>
        <div>
          <label className="label">Tone</label>
          <select className="input" value={form.tone} onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value as ToneOption }))}>
            {(['warm', 'formal', 'concise', 'motivational'] as ToneOption[]).map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Verified facts (AI uses only these — do not add unverified claims)</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input className="input flex-1 min-w-0" value={factInput} onChange={(e) => setFactInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFact(); } }}
            placeholder="Add a verified fact and press Enter" />
          <button type="button" onClick={addFact} className="btn-secondary">Add</button>
        </div>
        {(form.verified_facts || []).length > 0 && (
          <ul className="mt-2 space-y-1">
            {form.verified_facts!.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded px-2 py-1">
                <span className="flex-1">✓ {f}</span>
                <button onClick={() => removeFact(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <label className="label">Call to action (optional)</label>
        <input className="input" value={form.call_to_action || ''} onChange={(e) => setForm((f) => ({ ...f, call_to_action: e.target.value || undefined }))} placeholder="e.g. Confirm your pledge today" />
      </div>
      <button onClick={submit} disabled={busy} className="btn-primary flex items-center gap-2 w-full justify-center">
        {busy ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</> : <><Sparkles size={14} />Generate Impact Update</>}
      </button>
    </div>
  );
}

// ── Weekly summary form ───────────────────────────────────────────────────────

function WeeklySummaryForm({ onGenerated }: { onGenerated: (d: AiDraft) => void }) {
  const [dateRange, setDateRange] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const draft = await generateWeeklySummary(dateRange || undefined);
      onGenerated(draft);
      toast.success('Weekly summary generated — please review before use.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        The backend automatically fetches live stats (donors, pledges, contributions, campaigns).
        No personal data is sent to AI — aggregated counts only.
      </p>
      <div>
        <label className="label">Date range label (optional)</label>
        <input className="input" value={dateRange} onChange={(e) => setDateRange(e.target.value)} placeholder="e.g. Week of 23–29 June 2025" />
      </div>
      <button onClick={submit} disabled={busy} className="btn-primary flex items-center gap-2 w-full justify-center">
        {busy ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</> : <><Sparkles size={14} />Generate Weekly Summary</>}
      </button>
    </div>
  );
}

// ── Collector message form ────────────────────────────────────────────────────

function CollectorForm({ onGenerated }: { onGenerated: (d: AiDraft) => void }) {
  const [form, setForm] = useState<AiCollectorPayload>({ group_name: '', tone: 'warm', language: 'English' });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.group_name.trim()) { toast.error('Group name is required'); return; }
    setBusy(true);
    try {
      const draft = await generateCollectorMessage(form);
      onGenerated(draft);
      toast.success('Collector message generated — please review before use.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Group name *</label>
          <input className="input" value={form.group_name} onChange={(e) => setForm((f) => ({ ...f, group_name: e.target.value }))} placeholder="e.g. Kampala Circle" />
        </div>
        <div>
          <label className="label">Collector name (optional)</label>
          <input className="input" value={form.collector_name || ''} onChange={(e) => setForm((f) => ({ ...f, collector_name: e.target.value || undefined }))} placeholder="e.g. Sister Fatima" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Registered</label>
          <input type="number" className="input" value={form.registered_count ?? ''} onChange={(e) => setForm((f) => ({ ...f, registered_count: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="24" />
        </div>
        <div>
          <label className="label">Contributed</label>
          <input type="number" className="input" value={form.contributed_count ?? ''} onChange={(e) => setForm((f) => ({ ...f, contributed_count: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="18" />
        </div>
        <div>
          <label className="label">Pending</label>
          <input type="number" className="input" value={form.pending_count ?? ''} onChange={(e) => setForm((f) => ({ ...f, pending_count: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="6" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Campaign (optional)</label>
          <input className="input" value={form.campaign_title || ''} onChange={(e) => setForm((f) => ({ ...f, campaign_title: e.target.value || undefined }))} placeholder="e.g. June Gaza Relief" />
        </div>
        <div>
          <label className="label">Tone</label>
          <select className="input" value={form.tone} onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value as ToneOption }))}>
            {(['warm', 'formal', 'concise', 'motivational'] as ToneOption[]).map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <button onClick={submit} disabled={busy} className="btn-primary flex items-center gap-2 w-full justify-center">
        {busy ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</> : <><Sparkles size={14} />Generate Collector Message</>}
      </button>
    </div>
  );
}

// ── Generator section wrapper ─────────────────────────────────────────────────

function GeneratorSection({
  title, description, children, latestDraft, onStatusChange,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  latestDraft?: AiDraft;
  onStatusChange?: (d: AiDraft) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-start gap-3 p-5 text-left">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles size={18} className="text-primary" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{title}</div>
          <div className="text-sm text-gray-500 mt-0.5">{description}</div>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400 mt-1" /> : <ChevronDown size={16} className="text-gray-400 mt-1" />}
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
          {children}
          {latestDraft && (
            <AiDraftCard draft={latestDraft} onStatusChange={onStatusChange} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Draft list ────────────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS = [
  { label: 'All statuses', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Approved', value: 'approved' },
  { label: 'Published', value: 'published' },
  { label: 'Rejected', value: 'rejected' },
];

const TYPE_FILTER_OPTIONS = [
  { label: 'All types', value: '' },
  { label: 'Reminder', value: 'reminder' },
  { label: 'Impact Update', value: 'impact_update' },
  { label: 'Weekly Summary', value: 'weekly_summary' },
  { label: 'Collector Message', value: 'collector_message' },
];

const STATUS_BADGE_CLASS: Record<AiDraftStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  published: 'bg-blue-100 text-blue-800',
};

const TYPE_LABEL: Record<string, string> = {
  reminder: 'Reminder',
  impact_update: 'Impact Update',
  weekly_summary: 'Weekly Summary',
  collector_message: 'Collector Message',
  friday_challenge: 'Friday Challenge',
  emergency_appeal: 'Emergency Appeal',
  social_caption: 'Social Caption',
};

function DraftList() {
  const [drafts, setDrafts] = useState<AiDraft[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AiDraft | null>(null);

  const load = async (p = 1, s = statusFilter, t = typeFilter) => {
    setLoading(true);
    try {
      const res = await getAiDrafts({ page: p, size: 10, status: s || undefined, draft_type: t || undefined });
      setDrafts(res.items);
      setTotal(res.total);
    } catch {
      toast.error('Could not load drafts');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = (updated: AiDraft) => {
    setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    if (selected?.id === updated.id) setSelected(updated);
  };

  const pages = Math.ceil(total / 10);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select className="input w-auto" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); load(1, e.target.value, typeFilter); }}>
          {STATUS_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="input w-auto" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); load(1, statusFilter, e.target.value); }}>
          {TYPE_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={() => load(page)} className="btn-ghost flex items-center gap-1.5">
          <RefreshCw size={14} /> Refresh
        </button>
        <span className="text-sm text-gray-500 ml-auto">{total} draft{total !== 1 ? 's' : ''}</span>
      </div>

      {loading && <p className="text-sm text-gray-400 text-center py-4">Loading…</p>}
      {!loading && drafts.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No drafts found.</p>}

      {!loading && drafts.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Preview</th>
                <th className="px-4 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drafts.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{TYPE_LABEL[d.draft_type] || d.draft_type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE_CLASS[d.status]}`}>{d.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{d.generated_text.slice(0, 80)}…</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(selected?.id === d.id ? null : d)} className="text-primary text-xs font-medium hover:underline">
                      {selected?.id === d.id ? 'Close' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <AiDraftCard key={selected.id} draft={selected} onStatusChange={handleStatusChange} />
      )}

      {pages > 1 && (
        <div className="flex items-center gap-2 justify-center">
          <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p); }} className="btn-ghost text-xs px-3 py-1">Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => { const p = page + 1; setPage(p); load(p); }} className="btn-ghost text-xs px-3 py-1">Next</button>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AiAssistantPage() {
  const [latestDrafts, setLatestDrafts] = useState<Partial<Record<AiDraftType, AiDraft>>>({});
  const [activeTab, setActiveTab] = useState<'generate' | 'drafts'>('generate');

  const setLatest = (type: AiDraftType) => (draft: AiDraft) =>
    setLatestDrafts((prev) => ({ ...prev, [type]: draft }));

  const updateLatest = (type: AiDraftType) => (updated: AiDraft) =>
    setLatestDrafts((prev) =>
      prev[type]?.id === updated.id ? { ...prev, [type]: updated } : prev
    );

  return (
    <AdminLayout title="AI Assistant" subtitle="Generate content drafts — all content requires admin review before publishing">
      <div className="card p-4 mb-6 bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-amber-800">Human approval required before any content is published or sent</div>
          <div className="text-sm text-amber-700 mt-0.5">
            AI drafts are starting points only. AI cannot invent donation amounts, beneficiary numbers, Quran verses, or hadiths.
            The AI never confirms contributions or publishes automatically. Use the Approve → Publish flow in Draft History.
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['generate', 'drafts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'generate' ? 'Generate' : 'Draft History'}
          </button>
        ))}
      </div>

      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GeneratorSection
            title="Islamic Reminder"
            description="Generate a faith-based donor reminder for your audience"
            latestDraft={latestDrafts['reminder']}
            onStatusChange={updateLatest('reminder')}
          >
            <ReminderForm onGenerated={setLatest('reminder')} />
          </GeneratorSection>

          <GeneratorSection
            title="Impact Update"
            description="Generate a multi-format update (app, WhatsApp, push) from verified project facts"
            latestDraft={latestDrafts['impact_update']}
            onStatusChange={updateLatest('impact_update')}
          >
            <ImpactForm onGenerated={setLatest('impact_update')} />
          </GeneratorSection>

          <GeneratorSection
            title="Weekly Summary"
            description="Generate an internal summary using live platform stats — no manual data entry required"
            latestDraft={latestDrafts['weekly_summary']}
            onStatusChange={updateLatest('weekly_summary')}
          >
            <WeeklySummaryForm onGenerated={setLatest('weekly_summary')} />
          </GeneratorSection>

          <GeneratorSection
            title="Collector Circle Message"
            description="Generate a gentle follow-up message for a collector to send to their circle"
            latestDraft={latestDrafts['collector_message']}
            onStatusChange={updateLatest('collector_message')}
          >
            <CollectorForm onGenerated={setLatest('collector_message')} />
          </GeneratorSection>
        </div>
      )}

      {activeTab === 'drafts' && <DraftList />}
    </AdminLayout>
  );
}
