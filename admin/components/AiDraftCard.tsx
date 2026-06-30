'use client';
import { useState } from 'react';
import { AlertTriangle, Check, X, Send, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { AiDraft } from '../types';

interface AiDraftCardProps {
  draft: AiDraft;
  onApprove?: (content: string) => void;
  onReject?: () => void;
  onUseInNotification?: (content: string) => void;
  onUseInReminder?: (content: string) => void;
  onSaveDraft?: (content: string) => void;
}

export default function AiDraftCard({
  draft,
  onApprove,
  onReject,
  onUseInNotification,
  onUseInReminder,
  onSaveDraft,
}: AiDraftCardProps) {
  const [content, setContent] = useState(draft.content);
  const [approved, setApproved] = useState(false);

  const handleApprove = () => {
    setApproved(true);
    onApprove?.(content);
    toast.success('Draft approved.');
  };

  return (
    <div className="card p-5 space-y-4">
      {/* Warning */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 font-medium">
          AI drafts must be reviewed and approved by an admin before sending or publishing. Edit the content below as needed.
        </p>
      </div>

      {/* Editable content */}
      <div>
        <label className="label">Draft Content (editable)</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="input resize-y font-mono text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          Generated {new Date(draft.generated_at).toLocaleString()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        {!approved ? (
          <>
            <button onClick={handleApprove} className="btn-primary flex items-center gap-1.5">
              <Check size={14} /> Approve Draft
            </button>
            <button onClick={onReject} className="btn-danger flex items-center gap-1.5">
              <X size={14} /> Reject
            </button>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-green-700 text-sm font-semibold">
            <Check size={14} /> Approved
          </span>
        )}
        <button
          onClick={() => { onSaveDraft?.(content); toast.success('Saved as draft.'); }}
          className="btn-secondary flex items-center gap-1.5"
        >
          Save Draft
        </button>
        <button
          onClick={() => { onUseInNotification?.(content); toast.success('Copied to notification form.'); }}
          className="btn-ghost flex items-center gap-1.5"
        >
          <Send size={14} /> Use in Notification
        </button>
        <button
          onClick={() => { onUseInReminder?.(content); toast.success('Copied to reminder form.'); }}
          className="btn-ghost flex items-center gap-1.5"
        >
          <BookOpen size={14} /> Use in Reminder
        </button>
      </div>
    </div>
  );
}
