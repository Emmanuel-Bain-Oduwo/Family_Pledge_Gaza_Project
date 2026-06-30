'use client';
import { useState } from 'react';
import { AlertTriangle, Check, X, Send, BookOpen, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { AiDraft, AiDraftStatus } from '../types';
import { approveAiDraft, rejectAiDraft, publishAiDraft } from '../lib/api';

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
  const [busy, setBusy] = useState(false);

  const update = (updated: AiDraft) => {
    setDraft(updated);
    onStatusChange?.(updated);
  };

  const handleApprove = async () => {
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
      {/* Warning */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 font-medium">
          Review and edit this AI draft before approving. Do not publish unreviewed content.
        </p>
      </div>

      {/* Status + meta */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_BADGE[draft.status]}`}>
          {draft.status}
        </span>
        <span>{new Date(draft.created_at).toLocaleString()}</span>
      </div>

      {/* Content */}
      <div>
        <label className="label">Generated Draft</label>
        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[6rem]">
          {draft.generated_text}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        {draft.status === 'draft' && (
          <>
            <button onClick={handleApprove} disabled={busy} className="btn-primary flex items-center gap-1.5">
              <Check size={14} /> Approve
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

        {(draft.status === 'approved' || draft.status === 'published') && (
          <>
            <button
              onClick={() => { onUseInNotification?.(draft.generated_text); toast.success('Copied to notification.'); }}
              className="btn-ghost flex items-center gap-1.5"
            >
              <Send size={14} /> Use in Notification
            </button>
            <button
              onClick={() => { onUseInReminder?.(draft.generated_text); toast.success('Copied to reminder.'); }}
              className="btn-ghost flex items-center gap-1.5"
            >
              <BookOpen size={14} /> Use in Reminder
            </button>
          </>
        )}
      </div>
    </div>
  );
}
