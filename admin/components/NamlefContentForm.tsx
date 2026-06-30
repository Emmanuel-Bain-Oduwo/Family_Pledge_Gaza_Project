'use client';
import { useForm } from 'react-hook-form';
import { NamlefContent, NamlefContentType } from '../types';
import { createNamlefContent, updateNamlefContent } from '../lib/api';
import toast from 'react-hot-toast';

const TYPES: NamlefContentType[] = ['video', 'audio', 'text', 'link'];

interface NamlefContentFormProps {
  initial?: Partial<NamlefContent>;
  onSuccess: (c: NamlefContent) => void;
  onCancel: () => void;
}

export default function NamlefContentForm({ initial, onSuccess, onCancel }: NamlefContentFormProps) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Partial<NamlefContent>>({
    defaultValues: initial || { content_type: 'video', status: 'draft', featured: false },
  });

  const onSubmit = async (values: Partial<NamlefContent>) => {
    try {
      const result = initial?.id
        ? await updateNamlefContent(initial.id, values)
        : await createNamlefContent(values);
      toast.success(initial?.id ? 'Content updated.' : 'Content created.');
      onSuccess(result);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Speaker Name *</label>
          <input {...register('speaker_name', { required: true })} className="input" placeholder="Sheikh / Speaker name" />
        </div>

        <div>
          <label className="label">Speaker Role</label>
          <input {...register('speaker_role')} className="input" placeholder="e.g. Chairperson, NAMLEF" />
        </div>

        <div>
          <label className="label">Content Type *</label>
          <select {...register('content_type', { required: true })} className="input">
            {TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Status</label>
          <select {...register('status')} className="input">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Title *</label>
          <input {...register('title', { required: true })} className="input" />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea {...register('description')} className="input" rows={3} />
        </div>

        <div className="sm:col-span-2">
          <label className="label">URL (video / audio / link)</label>
          <input {...register('url')} className="input" placeholder="https://..." />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Thumbnail URL</label>
          <input {...register('thumbnail_url')} className="input" placeholder="https://..." />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" {...register('featured')} className="w-4 h-4 accent-gold" id="featured" />
          <label htmlFor="featured" className="text-sm font-medium text-gray-700 cursor-pointer">Featured</label>
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Saving…' : initial?.id ? 'Update' : 'Add Content'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}
