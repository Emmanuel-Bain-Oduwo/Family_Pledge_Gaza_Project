'use client';
import { useForm } from 'react-hook-form';
import { Project, ProjectCategory } from '../types';
import { createProject, updateProject } from '../lib/api';
import toast from 'react-hot-toast';

const CATEGORIES: ProjectCategory[] = ['food', 'water', 'clothing', 'emergency_cash', 'orphans', 'widows', 'children', 'general'];

interface ProjectFormProps {
  initial?: Partial<Project>;
  onSuccess: (p: Project) => void;
  onCancel: () => void;
}

export default function ProjectForm({ initial, onSuccess, onCancel }: ProjectFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Partial<Project>>({
    defaultValues: initial || { category: 'general', status: 'active' },
  });

  const onSubmit = async (values: Partial<Project>) => {
    try {
      const result = initial?.id
        ? await updateProject(initial.id, values)
        : await createProject(values);
      toast.success(initial?.id ? 'Project updated.' : 'Project created.');
      onSuccess(result);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save project.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Title *</label>
          <input {...register('title', { required: true })} className="input" placeholder="Project title" />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Description *</label>
          <textarea {...register('description', { required: true })} className="input" rows={3} />
        </div>

        <div>
          <label className="label">Category *</label>
          <select {...register('category', { required: true })} className="input">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, (s) => s.toUpperCase())}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Status</label>
          <select {...register('status')} className="input">
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        <div>
          <label className="label">Target Amount (USD)</label>
          <input type="number" {...register('target_amount', { valueAsNumber: true })} className="input" />
        </div>

        <div>
          <label className="label">Raised Amount (USD)</label>
          <input type="number" {...register('raised_amount', { valueAsNumber: true })} className="input" />
        </div>

        <div>
          <label className="label">Beneficiaries Count</label>
          <input type="number" {...register('beneficiaries_count', { valueAsNumber: true })} className="input" />
        </div>

        <div>
          <label className="label">Location</label>
          <input {...register('location')} className="input" placeholder="e.g. Gaza City" />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Image URL</label>
          <input {...register('image_url')} className="input" placeholder="https://..." />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Video URL</label>
          <input {...register('video_url')} className="input" placeholder="https://..." />
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Saving…' : initial?.id ? 'Update Project' : 'Create Project'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}
