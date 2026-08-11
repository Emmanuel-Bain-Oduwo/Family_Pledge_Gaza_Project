'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle, Check, X, Send, BookOpen, Globe, Save, Eye, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { AiDraft, AiDraftStatus } from '../types';
import { approveAiDraft, rejectAiDraft, publishAiDraft } from '../lib/api';
import { updateAiDraftText } from '../lib/aiWorkspaceApi';
import AiMessageContent from './AiMessageContent';

const STATUS_BADGE: Record<AiDraftStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  published: 'bg-blue-100 text-blue-800',
};

interface AiDraftCardProps {
  draft: AiDraft;
  onStatusChange?: (updated: AiDraft) => void;
  onUseInNotification?: (text: string) => void;
  onUseInReminder?: (text: string) => void;
}

export default function AiDraftCard({
  draft: initialDraft,
  onStatusChange,
  onUseInNotification,
  onUseInReminder,
}: AiDraftCardProps) {
  const [draft, setDraft] = useState<AiDraft>(initialDraft);
  const [editingText, setEditingText] = useState(initialDraft.generated_text);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    setDraft(initialDraft);
    setEditingText(initialDraft.generated_text);
    setPreview(false);
  }, [initialDraft]);

  const hasUnsavedChanges = editingText.trim() !== draft.generated_text.trim();

  const update = (updated: AiDraft) => {
    setDraft(updated);
    setEditingText(updated.generated_text);
    onStatusChange?.(updated);
  };

  const handleSave = async () => {
    if (!editingText.trim()) {
      toast.error('Draft text cannot be empty.');
      return;
    }
    setBusy(true);
    try {
      const updated = await updateAiDraftText(draft.id, editingText);
      update(updated);
      toast.success('Your edits were saved.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not save draft');
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    if (hasUnsavedChanges) {
      toast.error('Save your edits before approving this draft.');
      return;
    }
    setBusy(true);
    try {
      const updated = await approveAiDraft(draft.id);
      update(updated);
      toast.success('Draft approved.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not approve draft');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setBusy(true);
    try {
      const updated = await rejectAiDraft(draft.id);
      update(updated);
      toast.success('Draft rejected.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not reject draft');
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    setBusy(true);
    try {
      const updated = await publishAiDraft(draft.id);
      update(updated);
      toast.success('Draft marked as published.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not publish draft');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 font-medium">
          AI output is a starting point. Edit it below, save your changes, then approve only after human review.
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_BADGE[draft.status]}`}>
          {draft.status}
        </span>
        <span>{new Date(draft.created_at).toLocaleString()}</span>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label className="label mb-0">{draft.status === 'draft' ? 'Editable Draft' : 'Reviewed Draft'}</label>
          {draft.status === 'draft' && (
            <button type="button" onClick={() => setPreview((value) => !value)} className="btn-ghost inline-flex items-center gap-1.5 text-xs">
              {preview ? <><Pencil size={13}/>Edit</> : <><Eye size={13}/>Preview formatting</>}
            </button>
          )}
        </div>
        {draft.status === 'draft' ? (
          preview ? (
            <div className="min-h-[12rem] rounded-lg border border-gray-200 bg-white p-4">
              <AiMessageContent content={editingText} />
            </div>
          ) : (
            <textarea
              className="input min-h-[12rem] font-sans text-sm leading-6"
              value={editingText}
              onChange={(event) => setEditingText(event.target.value)}
              disabled={busy}
              aria-label="Edit AI draft"
            />
          )
        ) : (
          <div className="min-h-[6rem] rounded-lg border border-gray-200 bg-gray-50 p-4">
            <AiMessageContent content={draft.generated_text} />
          </div>
        )}
        {draft.status === 'draft' && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={busy || !hasUnsavedChanges || !editingText.trim()}
              className="btn-secondary flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save size={14} /> Save changes
            </button>
            {hasUnsavedChanges && <span className="text-xs font-medium text-amber-600">Unsaved edits</span>}
            {!hasUnsavedChanges && <span className="text-xs text-gray-400">All changes saved</span>}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        {draft.status === 'draft' && (
          <>
            <button onClick={handleApprove} disabled={busy || hasUnsavedChanges} className="btn-primary flex items-center gap-1.5 disabled:opacity-50">
              <Check size={14} /> Approve reviewed draft
            </button>
            <button onClick={handleReject} disabled={busy} className="btn-danger flex items-center gap-1.5">
              <X size={14} /> Reject
            </button>
          </>
        )}

        {draft.status === 'approved' && (
          <>
            <button onClick={handlePublish} disabled={busy} className="btn-primary flex items-center gap-1.5">
              <Globe size={14} /> Mark Published
            </button>
            <button onClick={handleReject} disabled={busy} className="btn-danger flex items-center gap-1.5">
              <X size={14} /> Reject
            </button>
          </>
        )}

        {draft.status === 'published' && (
          <span className="inline-flex items-center gap-1.5 text-blue-700 text-sm font-semibold">
            <Globe size={14} /> Published
            {draft.published_at && (
              <span className="text-gray-400 font-normal ml-1">
                {new Date(draft.published_at).toLocaleDateString()}
              </span>
            )}
          </span>
        )}

        {draft.status === 'rejected' && (
          <span className="inline-flex items-center gap-1.5 text-red-600 text-sm font-semibold">
            <X size={14} /> Rejected
          </span>
        )}

        {(draft.status === 'approved' || draft.status === 'published') && onUseInNotification && (
          <button
            onClick={() => onUseInNotification(draft.generated_text)}
            className="btn-ghost flex items-center gap-1.5"
          >
            <Send size={14} /> Use in Notification
          </button>
        )}
        {(draft.status === 'approved' || draft.status === 'published') && onUseInReminder && (
          <button
            onClick={() => onUseInReminder(draft.generated_text)}
            className="btn-ghost flex items-center gap-1.5"
          >
            <BookOpen size={14} /> Use in Reminder
          </button>
        )}
      </div>
    </div>
  );
}
