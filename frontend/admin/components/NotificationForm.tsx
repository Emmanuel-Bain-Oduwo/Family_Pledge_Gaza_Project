'use client';
import { useForm } from 'react-hook-form';
import { NotificationAudience } from '../types';
import { sendNotification } from '../lib/api';
import toast from 'react-hot-toast';

const AUDIENCES: { value: NotificationAudience; label: string }[] = [
  { value: 'all_users', label: 'All Users' },
  { value: 'pending_donors', label: 'Pending Donors' },
  { value: 'confirmed_donors', label: 'Confirmed Donors' },
  { value: 'collectors', label: 'Collectors' },
  { value: 'admins', label: 'Admins Only' },
];

const TYPES = ['reminder', 'campaign', 'emergency', 'impact', 'pledge', 'system'];

interface NotifPayload {
  title: string;
  body: string;
  notification_type: string;
  audience: NotificationAudience;
}

interface NotificationFormProps {
  onSuccess?: () => void;
  onSubmit?: (values: NotifPayload) => Promise<void>;
  prefill?: Partial<NotifPayload>;
  loading?: boolean;
}

export default function NotificationForm({ onSuccess, onSubmit: onSubmitOverride, prefill, loading }: NotificationFormProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<NotifPayload>({
    defaultValues: prefill || { audience: 'all_users', notification_type: 'reminder' },
  });

  const onSubmit = async (values: NotifPayload) => {
    if (onSubmitOverride) {
      await onSubmitOverride(values);
      reset();
      return;
    }
    try {
      await sendNotification(values);
      toast.success(`Notification sent to ${values.audience.replace(/_/g, ' ')}.`);
      reset();
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || 'Failed to send notification.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Notification Title *</label>
          <input {...register('title', { required: 'Title is required' })} className="input" placeholder="e.g. Friday Challenge is Live!" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="label">Body *</label>
          <textarea {...register('body', { required: 'Body is required', maxLength: { value: 300, message: 'Max 300 characters' } })} className="input" rows={4} placeholder="Notification message…" />
          {errors.body && <p className="text-red-500 text-xs mt-1">{errors.body.message}</p>}
        </div>

        <div>
          <label className="label">Type</label>
          <select {...register('notification_type')} className="input">
            {TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Audience *</label>
          <select {...register('audience', { required: true })} className="input">
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <button type="submit" disabled={isSubmitting || loading} className="btn-primary w-full">
          {isSubmitting || loading ? 'Sending…' : 'Send Notification'}
        </button>
      </div>
    </form>
  );
}
