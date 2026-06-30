'use client';
import { useState } from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import AiDraftCard from '../../components/AiDraftCard';
import { generateReminderDraft, generateImpactDraft, generateWeeklySummary, generateCollectorMessage } from '../../lib/api';
import { AiDraft } from '../../types';
import toast from 'react-hot-toast';

const MOCK_DRAFTS: Record<string, AiDraft> = {
  reminder: {
    content: `🌙 Assalamu Alaykum dear brother/sister,\n\nAllah ﷻ says: "And spend in the cause of Allah and do not throw yourselves with your own hands into destruction." (Al-Baqarah 2:195)\n\nThe people of Gaza are in desperate need. Your $10 monthly pledge is not just money — it is a lifeline. A family fed. A child clothed. A heart given hope.\n\nThis Friday, before Jumu'ah, confirm your pledge and earn the reward of sadaqah on the best day of the week.\n\nJazakAllah Khayr for standing with Gaza. 🇵🇸`,
    type: 'reminder',
    generated_at: new Date().toISOString(),
  },
  impact: {
    content: `📢 *Update from the Field — Gaza Relief*\n\nAlhamdulillah, your contributions this month made a real difference:\n\n✅ 500 food packages delivered to displaced families in Rafah\n✅ Clean water now reaches 200+ families in Beit Lahiya\n✅ 12 orphaned children received school supplies\n\nEvery pledge matters. Every $10 reaches someone who needs it most.\n\nMay Allah accept your sadaqah and multiply your reward. 🤲`,
    type: 'impact_update',
    generated_at: new Date().toISOString(),
  },
  weekly: {
    content: `*Family Pledge — Weekly Summary*\n\nAssalamu Alaykum dear donors,\n\nHere is your weekly update for the week ending ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}:\n\n📊 This week:\n• 156 contributions confirmed\n• 43 pending review\n• $1,560 tracked for Gaza relief\n\n🎯 Friday Challenge: 142/200 donors reached — we're close! Help us reach our goal.\n\n🌿 Your pledge is sadaqah jariyah. Every week, Gaza families benefit from your generosity.\n\nBarakAllah Feekum 🙏`,
    type: 'weekly_summary',
    generated_at: new Date().toISOString(),
  },
  collector: {
    content: `Assalamu Alaykum dear collector,\n\nJazakAllah Khayr for your role as a Family Pledge collector. You are doing the work of the ummah.\n\n📋 This month's circle update:\n• 18 of your 24 members have confirmed their June pledge — Alhamdulillah!\n• 6 members still pending — a gentle reminder goes a long way\n\n💬 Suggested message to send your circle:\n"Assalamu Alaykum! Just a reminder that your June Family Pledge is due. It's just $10 — please confirm when you can. JazakAllah Khayr. 🤲"\n\nMay Allah reward you abundantly for every pledge you facilitate. 🌟`,
    type: 'collector_message',
    generated_at: new Date().toISOString(),
  },
};

type DraftKey = 'reminder' | 'impact' | 'weekly' | 'collector';

interface GeneratorConfig {
  key: DraftKey;
  label: string;
  description: string;
  fields?: { name: string; label: string; placeholder: string }[];
}

const GENERATORS: GeneratorConfig[] = [
  {
    key: 'reminder',
    label: 'Islamic Reminder',
    description: 'Generate a Quran/hadith-based reminder to motivate donors to pledge',
    fields: [{ name: 'theme', label: 'Theme', placeholder: 'e.g. sadaqah, brotherhood, urgency' }],
  },
  {
    key: 'impact',
    label: 'Impact Update',
    description: 'Generate an update on how donations are helping people in Gaza',
    fields: [{ name: 'project', label: 'Project', placeholder: 'e.g. food packages, water wells, orphans' }],
  },
  {
    key: 'weekly',
    label: 'Weekly Summary',
    description: 'Generate a summary of the week\'s pledge activity and highlights',
  },
  {
    key: 'collector',
    label: 'Collector Message',
    description: 'Generate a message for collectors to send to their circles',
    fields: [{ name: 'context', label: 'Context', placeholder: 'e.g. end of month, Friday, Ramadan' }],
  },
];

export default function AiAssistantPage() {
  const [drafts, setDrafts] = useState<Partial<Record<DraftKey, AiDraft>>>({});
  const [generating, setGenerating] = useState<DraftKey | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});

  const setField = (key: DraftKey, field: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }));
  };

  const generate = async (config: GeneratorConfig) => {
    setGenerating(config.key);
    const params = fieldValues[config.key] || {};
    try {
      let draft: AiDraft;
      if (config.key === 'reminder') draft = await generateReminderDraft(params);
      else if (config.key === 'impact') draft = await generateImpactDraft(params);
      else if (config.key === 'weekly') draft = await generateWeeklySummary();
      else draft = await generateCollectorMessage(params);
      setDrafts((prev) => ({ ...prev, [config.key]: draft }));
      toast.success('Draft generated — please review before using.');
    } catch {
      setDrafts((prev) => ({ ...prev, [config.key]: MOCK_DRAFTS[config.key] }));
      toast.success('Draft generated — please review before using.');
    } finally {
      setGenerating(null);
    }
  };

  const clearDraft = (key: DraftKey) => setDrafts((prev) => { const next = { ...prev }; delete next[key]; return next; });

  return (
    <AdminLayout title="AI Assistant" subtitle="Generate content drafts — all content requires admin review before publishing">
      {/* Warning banner */}
      <div className="card p-4 mb-6 bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-amber-800">Always review AI-generated content before sending</div>
          <div className="text-sm text-amber-700 mt-0.5">AI drafts are starting points only. Edit for accuracy, Islamic appropriateness, and tone before publishing or sending to donors. The approve button documents your review.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {GENERATORS.map((config) => (
          <div key={config.key} className="space-y-4">
            {/* Generator card */}
            <div className="card p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={18} className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{config.label}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{config.description}</div>

                  {config.fields && (
                    <div className="mt-3 space-y-2">
                      {config.fields.map((field) => (
                        <div key={field.name}>
                          <label className="label">{field.label}</label>
                          <input
                            value={fieldValues[config.key]?.[field.name] || ''}
                            onChange={(e) => setField(config.key, field.name, e.target.value)}
                            className="input"
                            placeholder={field.placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => generate(config)}
                    disabled={generating === config.key}
                    className="btn-primary mt-3 flex items-center gap-2"
                  >
                    {generating === config.key ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
                    ) : (
                      <><Sparkles size={14} /> Generate Draft</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Draft output */}
            {drafts[config.key] && (
              <AiDraftCard
                draft={drafts[config.key]!}
                onSaveDraft={(content) => setDrafts((prev) => ({ ...prev, [config.key]: { ...prev[config.key]!, content } }))}
                onReject={() => clearDraft(config.key)}
              />
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
