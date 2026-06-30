'use client';
import { useForm } from 'react-hook-form';
import { Campaign, CampaignType } from '../types';
import { createCampaign, updateCampaign } from '../lib/api';
import toast from 'react-hot-toast';

const TYPES: CampaignType[] = ['monthly', 'friday_challenge', 'emergency', 'sponsorship', 'food', 'water', 'clothing', 'general'];

interface CampaignFormProps {
  initial?: Partial<Campaign>;
  onSuccess: (c: Campaign) => void;
  onCancel: () => void;
}

export default function CampaignForm({ initial, onSuccess, onCancel }: CampaignFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Partial<Campaign>>({
    defaultValues: initial || { type: 'monthly', is_active: true, is_urgent: false, status: 'active' },
  });

  const onSubmit = async (values: Partial<Campaign>) => {
    try {
      const result = initial?.id
        ? await updateCampaign(initial.id, values)
        : await createCampaign(values);
      toast.success(initial?.id ? 'Campaign updated.' : 'Campaign created.');
      onSuccess(result);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save campaign.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Title *</label>
          <input {...register('title', { required: 'Title is required' })} className="input" placeholder="Campaign title" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="label">Description *</label>
          <textarea {...register('description', { required: true })} className="input" rows={3} placeholder="Campaign description" />
        </div>

        <div>
          <label className="label">Type *</label>
          <select {...register('type', { required: true })} className="input">
            {TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Status</label>
          <select {...register('status')} className="input">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className="label">Donor Target</label>
          <input type="number" {...register('target_donors', { valueAsNumber: true })} className="input" placeholder="e.g. 200" />
        </div>

        <div>
          <label className="label">Amount Target (USD)</label>
          <input type="number" {...register('target_amount', { valueAsNumber: true })} className="input" placeholder="e.g. 2000" />
        </div>

        <div>
          <label className="label">Start Date</label>
          <input type="date" {...register('start_date')} className="input" />
        </div>

        <div>
          <label className="label">End Date</label>
          <input type="date" {...register('end_date')} className="input" />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Cover Image URL</label>
          <input {...register('cover_image_url')} className="input" placeholder="https://..." />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Video URL</label>
          <input {...register('video_url')} className="input" placeholder="https://..." />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('is_active')} className="w-4 h-4 accent-primary" />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('is_urgent')} className="w-4 h-4 accent-red-600" />
            <span className="text-sm font-medium text-gray-700">Urgent</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Saving…' : initial?.id ? 'Update Campaign' : 'Create Campaign'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}
