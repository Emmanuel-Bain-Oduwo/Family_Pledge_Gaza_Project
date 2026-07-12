'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Save, ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import AdminLayout from '../../components/AdminLayout';
import { getAdminMe, getSettings, updateAdminProfile, updateSettings } from '../../lib/api';
import { AdminProfileUpdate, AppSettings } from '../../types';
import { FAMILY_PLEDGE_LOGO_DATA_URI } from '../../lib/logo';
import toast from 'react-hot-toast';


export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<AppSettings>();
  const { register: registerProfile, handleSubmit: handleProfileSubmit, reset: resetProfile, formState: { errors: profileErrors, isDirty: isProfileDirty } } = useForm<AdminProfileUpdate>();

  useEffect(() => {
    Promise.all([
      getSettings().then((s) => reset(s)),
      getAdminMe().then((admin) => resetProfile({
        full_name: admin.full_name || '',
        nickname: admin.nickname || '',
        email: admin.email || '',
        phone: admin.phone || '',
      })),
    ])
      .catch((e) => setLoadError(e.message || 'Unable to load settings.'))
      .finally(() => setLoading(false));
  }, [reset, resetProfile]);

  const onSubmit = async (values: AppSettings) => {
    setSaving(true);
    try {
      await updateSettings(values);
      reset(values);
      toast.success('Settings saved.');
    } catch (e: any) {
      toast.error(e.message || 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };


  const onProfileSubmit = async (values: AdminProfileUpdate) => {
    const payload = {
      full_name: values.full_name?.trim() || null,
      nickname: values.nickname?.trim() || null,
      email: values.email?.trim().toLowerCase() || null,
      phone: values.phone?.trim() || null,
    };
    setProfileSaving(true);
    try {
      const updated = await updateAdminProfile(payload);
      resetProfile({
        full_name: updated.full_name || '',
        nickname: updated.nickname || '',
        email: updated.email || '',
        phone: updated.phone || '',
      });
      window.dispatchEvent(new Event('admin-profile-updated'));
      toast.success('Admin profile saved.');
    } catch (e: any) {
      toast.error(e.message || 'Unable to save admin profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  if (loading) return (
    <AdminLayout title="Settings" subtitle="App configuration and organization details">
      <div className="card p-10 text-center text-gray-400">Loading settings…</div>
    </AdminLayout>
  );

  if (loadError) return (
    <AdminLayout title="Settings" subtitle="App configuration and organization details">
      <div className="card p-10 text-center text-red-600">{loadError}</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Settings" subtitle="App configuration and organization details">

      <div className="max-w-2xl space-y-6">
        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="card p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Admin Profile</h2>
            <p className="text-sm text-gray-500 mt-1">Your email and phone number can be used for future admin sign-ins.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <input {...registerProfile('full_name')} className="input" placeholder="Full name" />
            </div>
            <div>
              <label className="label">Nickname</label>
              <input {...registerProfile('nickname')} className="input" placeholder="Nickname" />
            </div>
            <div>
              <label className="label">Email address</label>
              <input
                {...registerProfile('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' } })}
                type="email"
                className="input"
                placeholder="admin@familypledge.org"
              />
              {profileErrors.email && <p className="text-red-500 text-xs mt-1">{profileErrors.email.message}</p>}
            </div>
            <div>
              <label className="label">Phone number</label>
              <input {...registerProfile('phone')} className="input" placeholder="+254700000001" />
            </div>
          </div>
          <button type="submit" disabled={profileSaving || !isProfileDirty} className="btn-primary flex items-center gap-2">
            <Save size={16} /> {profileSaving ? 'Saving profile…' : 'Save Admin Profile'}
          </button>
        </form>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6 flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden">
            <Image
              src={FAMILY_PLEDGE_LOGO_DATA_URI}
              alt="Family Pledge logo"
              width={80}
              height={80}
              className="object-contain"
              unoptimized
            />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Family Pledge brand</h2>
            <p className="text-sm text-gray-500 mt-1">Owner-provided logo and payment settings shown during the demo.</p>
          </div>
        </div>

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
              <p className="text-xs text-gray-400 mt-1">Displayed in the Contribute Now flow in the mobile app.</p>
            </div>
          </div>
        </div>

        {/* Bank / M-PESA */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">DIB Bank / M-PESA Details</h2>
          <p className="text-xs text-gray-400 mb-4">Admin-managed payment details used for owner demo and donor payment guidance.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Account Name</label>
              <input {...register('payment_account_name')} className="input" />
            </div>
            <div>
              <label className="label">Account Number</label>
              <input {...register('payment_account_number')} className="input" />
            </div>
            <div>
              <label className="label">Currency</label>
              <input {...register('payment_currency')} className="input" />
            </div>
            <div>
              <label className="label">M-PESA PayBill</label>
              <input {...register('payment_mpesa_paybill')} className="input" />
            </div>
            <div>
              <label className="label">Bank Name</label>
              <input {...register('payment_bank_name')} className="input" />
            </div>
            <div>
              <label className="label">Branch Name</label>
              <input {...register('payment_branch_name')} className="input" />
            </div>
            <div>
              <label className="label">SWIFT Code</label>
              <input {...register('payment_swift_code')} className="input" />
            </div>
            <div>
              <label className="label">Intermediary SWIFT</label>
              <input {...register('payment_intermediary_swift_code')} className="input" />
            </div>
            <div>
              <label className="label">Intermediary Bank</label>
              <input {...register('payment_intermediary_bank')} className="input" />
            </div>
            <div>
              <label className="label">Bank / Branch Codes</label>
              <div className="grid grid-cols-2 gap-2">
                <input {...register('payment_bank_code')} className="input" placeholder="Bank code" />
                <input {...register('payment_branch_code')} className="input" placeholder="Branch code" />
              </div>
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
      </div>
    </AdminLayout>
  );
}
