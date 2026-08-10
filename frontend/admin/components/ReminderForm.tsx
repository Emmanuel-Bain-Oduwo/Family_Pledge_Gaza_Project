'use client';
import { Controller, useForm } from 'react-hook-form';
import {
  AdminReminder, ReminderWrite, approveAdminReminder, createAdminReminder,
  publishAdminReminder, updateAdminReminder,
} from '../lib/remindersAdminApi';
import MediaUrlInput from './MediaUrlInput';
import toast from 'react-hot-toast';

const TYPES = ['quran', 'hadith', 'dua', 'dhikr', 'shirk', 'motivation', 'friday', 'sadaqah'] as const;
type FormValues = Partial<AdminReminder> & { scheduled_for?: string };

interface ReminderFormProps {
  initial?: Partial<AdminReminder>;
  onSuccess: (r: AdminReminder) => void;
  onCancel: () => void;
}

function typeLabel(type:string){
  if(type==='dua') return "Du'a";
  if(type==='dhikr') return 'Dhikr';
  if(type==='shirk') return 'Shirk Awareness';
  if(type==='friday') return "Jumu'ah";
  if(type==='sadaqah') return 'Sadaqah';
  return type.charAt(0).toUpperCase()+type.slice(1);
}

export default function ReminderForm({ initial, onSuccess, onCancel }: ReminderFormProps) {
  const initialSchedule = initial?.scheduled_for ? toLocalInput(initial.scheduled_for) : '';
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { ...(initial || { type: 'quran', status: 'draft' }), scheduled_for: initialSchedule },
  });

  const payload = (values: FormValues): ReminderWrite => ({
    type: values.type,
    title: values.title,
    arabic_text: values.arabic_text,
    text: values.text,
    translation: values.translation,
    explanation: values.explanation,
    source_reference: values.source_reference,
    image_url: values.image_url,
    scheduled_for: values.scheduled_for ? new Date(values.scheduled_for).toISOString() : null,
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const result = initial?.id
        ? await updateAdminReminder(initial.id, payload(values))
        : await createAdminReminder(payload(values));
      toast.success(initial?.id ? 'Content updated.' : 'Draft created.');
      onSuccess(result);
    } catch (e: any) { toast.error(e.message || 'Failed to save content.'); }
  };

  const handleApprove = async () => {
    if (!initial?.id) { toast.error('Save the draft first.'); return; }
    try { const result = await approveAdminReminder(initial.id); toast.success('Content approved for scheduling or publishing.'); onSuccess(result); }
    catch (e:any) { toast.error(e.message || 'Could not approve content.'); }
  };

  const handlePublish = async () => {
    if (!initial?.id) { toast.error('Save the draft first.'); return; }
    try { const result = await publishAdminReminder(initial.id); toast.success('Published and category-aware push delivery started.'); onSuccess(result); }
    catch (e:any) { toast.error(e.message || 'Failed to publish.'); }
  };

  return <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
      <b>Automatic publishing:</b> choose a date/time, save the content, then approve it. The OVH operations worker publishes approved content when the scheduled time arrives and sends it only to users who opted into that category.
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div><label className="label">Type *</label><select {...register('type', { required: true })} className="input">{TYPES.map((t)=><option key={t} value={t}>{typeLabel(t)}</option>)}</select></div>
      <div><label className="label">Workflow</label><div className="input flex items-center bg-gray-50 text-gray-600 capitalize">{initial?.status || 'draft'}</div></div>
      <div className="sm:col-span-2"><label className="label">Title *</label><input {...register('title',{required:true})} className="input" placeholder="Short donor-facing title"/></div>
      <div className="sm:col-span-2"><label className="label">Arabic Text</label><textarea {...register('arabic_text')} className="input text-right" rows={3} dir="rtl" placeholder="Paste only source-verified Arabic text"/></div>
      <div className="sm:col-span-2"><label className="label">Text / Content *</label><textarea {...register('text',{required:true})} className="input" rows={3} placeholder="Main content"/></div>
      <div className="sm:col-span-2"><label className="label">Translation</label><textarea {...register('translation')} className="input" rows={2}/></div>
      <div className="sm:col-span-2"><label className="label">Explanation / Motivation</label><textarea {...register('explanation')} className="input" rows={3}/></div>
      <div><label className="label">Source Reference</label><input {...register('source_reference')} className="input" placeholder="e.g. Quran 2:195 / verified Hadith source"/><p className="mt-1 text-[11px] text-gray-400">Required operationally for exact Qur&apos;an/Hadith wording; use qualified review for nuanced shirk/fiqh claims.</p></div>
      <div><label className="label">Automatic publish date & time</label><input type="datetime-local" {...register('scheduled_for')} className="input"/><p className="mt-1 text-[11px] text-gray-400">Leave blank for manual publishing. Scheduled content must be Approved before the due time.</p></div>
      <div className="sm:col-span-2"><Controller control={control} name="image_url" render={({field})=><MediaUrlInput label="Content Image" value={field.value||''} onChange={field.onChange} accept={['r2']} uploadFolder="reminders" relatedEntityType="reminder" relatedEntityId={initial?.id}/>}/></div>
    </div>
    <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100"><button type="submit" disabled={isSubmitting} className="btn-primary">{isSubmitting?'Saving…':initial?.id?'Save Changes':'Create Draft'}</button>{initial?.id&&initial.status==='draft'&&<button type="button" onClick={()=>void handleApprove()} className="btn-secondary">Approve Content</button>}{initial?.id&&initial.status!=='published'&&<button type="button" onClick={()=>void handlePublish()} className="btn-secondary">Publish Now</button>}<button type="button" onClick={onCancel} className="btn-ghost">Cancel</button></div>
  </form>;
}

function toLocalInput(value:string){const d=new Date(value);const offset=d.getTimezoneOffset();return new Date(d.getTime()-offset*60000).toISOString().slice(0,16);}
