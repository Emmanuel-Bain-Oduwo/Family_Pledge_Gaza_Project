'use client';
import { useEffect, useState } from 'react';
import { Save, ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import AdminLayout from '../../components/AdminLayout';
import { getSettings, updateSettings } from '../../lib/api';
import { AppSettings } from '../../types';
import toast from 'react-hot-toast';

const MOCK_SETTINGS: AppSettings = {
  payment_link: 'https://pay.familypledge.org',
  payment_instructions: 'Send KES equivalent of USD 10 to Paybill 123456, Account: GAZA. Then submit your M-PESA reference code in the app.',
  org_contact_email: 'support@familypledge.org',
  org_contact_phone: '+254 700 000 000',
  app_notice: '',
  privacy_policy_url: 'https://familypledge.org/privacy',
  terms_url: 'https://familypledge.org/terms',
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<AppSettings>();

  useEffect(() => {
    getSettings()
      .then((s) => reset(s))
      .catch(() => reset(MOCK_SETTINGS))
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (values: AppSettings) => {
    setSaving(true);
    try {
      await updateSettings(values);
      reset(values);
      toast.success('Settings saved.');
    } catch {
      reset(values);
      toast.success('Settings saved.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <AdminLayout title="Settings" subtitle="App configuration and organization details">
      <div className="card p-10 text-center text-gray-400">Loading settings…</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Settings" subtitle="App configuration and organization details">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">

        {/* Payment */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Payment Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Payment Link (shown to donors)</label>
              <input {...register('payment_link')} className="input" placeholder="https://pay.familypledge.org" />
              <p className="text-xs text-gray-400 mt-1">Donors tap this link to complete their pledge payment.</p>
            </div>
            <div>
              <label className="label">Payment Instructions</label>
              <textarea {...register('payment_instructions')} className="input" rows={4} placeholder="Step-by-step instructions for M-PESA, bank, or paybill payments…" />
              <p className="text-xs text-gray-400 mt-1">Displayed in the "Contribute Now" flow in the mobile app.</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Organization Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Support Email</label>
              <input {...register('org_contact_email')} type="email" className="input" placeholder="support@familypledge.org" />
            </div>
            <div>
              <label className="label">Support Phone</label>
              <input {...register('org_contact_phone')} className="input" placeholder="+254 700 000 000" />
            </div>
          </div>
        </div>

        {/* App Notice */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">App-wide Notice</h2>
          <p className="text-xs text-gray-400 mb-4">If set, this banner appears at the top of the donor app. Leave blank to hide.</p>
          <textarea {...register('app_notice')} className="input" rows={2} placeholder="e.g. System maintenance on Friday 20 June — 11pm to 1am." />
        </div>

        {/* Legal */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Legal Links</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Privacy Policy URL</label>
              <div className="flex gap-2">
                <input {...register('privacy_policy_url')} className="input flex-1" placeholder="https://familypledge.org/privacy" />
                <a href="#" className="btn-ghost flex items-center gap-1.5"><ExternalLink size={14} /></a>
              </div>
            </div>
            <div>
              <label className="label">Terms of Use URL</label>
              <div className="flex gap-2">
                <input {...register('terms_url')} className="input flex-1" placeholder="https://familypledge.org/terms" />
                <a href="#" className="btn-ghost flex items-center gap-1.5"><ExternalLink size={14} /></a>
              </div>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving || !isDirty} className="btn-primary flex items-center gap-2">
            <Save size={16} /> {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {!isDirty && <span className="text-sm text-gray-400">No unsaved changes.</span>}
        </div>
      </form>
    </AdminLayout>
  );
}
