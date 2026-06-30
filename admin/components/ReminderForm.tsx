'use client';
import { useForm } from 'react-hook-form';
import { Reminder, ReminderType } from '../types';
import { createReminder, updateReminder, publishReminder } from '../lib/api';
import toast from 'react-hot-toast';

const TYPES: ReminderType[] = ['quran', 'hadith', 'dua', 'motivation', 'friday', 'sadaqah'];

interface ReminderFormProps {
  initial?: Partial<Reminder>;
  onSuccess: (r: Reminder) => void;
  onCancel: () => void;
}

export default function ReminderForm({ initial, onSuccess, onCancel }: ReminderFormProps) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Partial<Reminder>>({
    defaultValues: initial || { type: 'quran', status: 'draft' },
  });

  const onSubmit = async (values: Partial<Reminder>) => {
    try {
      const result = initial?.id
        ? await updateReminder(initial.id, values)
        : await createReminder(values);
      toast.success(initial?.id ? 'Reminder updated.' : 'Reminder created.');
      onSuccess(result);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save reminder.');
    }
  };

  const handlePublish = async () => {
    if (!initial?.id) { toast.error('Save the reminder first.'); return; }
    try {
      const result = await publishReminder(initial.id);
      toast.success('Reminder published.');
      onSuccess(result);
    } catch (e: any) {
      toast.error(e.message || 'Failed to publish.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Type *</label>
          <select {...register('type', { required: true })} className="input">
            {TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Status</label>
          <select {...register('status')} className="input">
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Title *</label>
          <input {...register('title', { required: true })} className="input" placeholder="Reminder title" />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Arabic Text</label>
          <textarea {...register('arabic_text')} className="input text-right" rows={2} dir="rtl" placeholder="النص العربي" />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Text / Content *</label>
          <textarea {...register('text', { required: true })} className="input" rows={3} placeholder="Main content / translation" />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Translation</label>
          <textarea {...register('translation')} className="input" rows={2} />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Explanation</label>
          <textarea {...register('explanation')} className="input" rows={2} />
        </div>

        <div>
          <label className="label">Source Reference</label>
          <input {...register('source_reference')} className="input" placeholder="e.g. Quran 5:32 / Sahih Bukhari" />
        </div>

        <div>
          <label className="label">Scheduled Date</label>
          <input type="date" {...register('scheduled_date')} className="input" />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Image URL</label>
          <input {...register('image_url')} className="input" placeholder="https://..." />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Saving…' : initial?.id ? 'Update' : 'Create Reminder'}
        </button>
        {initial?.id && initial.status !== 'published' && (
          <button type="button" onClick={handlePublish} className="btn-secondary">
            Approve & Publish
          </button>
        )}
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}
