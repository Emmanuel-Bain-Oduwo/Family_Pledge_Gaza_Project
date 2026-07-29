'use client';
import { useState } from 'react';
import { ExternalLink, FileCheck2, Upload } from 'lucide-react';
import { uploadToR2, type UploadedMedia } from '../lib/media';

const HTTP_URL_RE = /^https:\/\/[^\s]+$/i;
const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif|svg)([?#]|$)/i;

export type MediaFolder =
  | 'projects' | 'impact' | 'namlef' | 'reminders'
  | 'contribution_proofs' | 'documents' | 'general';

interface MediaUrlInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Retained for backwards-compatible form callers; all HTTPS media URLs are accepted. */
  accept?: ('cloudinary' | 'youtube' | 'r2')[];
  showPreview?: boolean;
  uploadFolder?: MediaFolder;
  required?: boolean;
  hint?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  onUploaded?: (media: UploadedMedia) => void;
}

function readableBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function MediaUrlInput({
  label, value, onChange, placeholder, showPreview = true, uploadFolder,
  required, hint, relatedEntityType, relatedEntityId, onUploaded,
}: MediaUrlInputProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploaded, setUploaded] = useState<UploadedMedia | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const isValid = !value || HTTP_URL_RE.test(value);
  const isImage = IMAGE_EXT_RE.test(value);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadFolder) return;
    setUploading(true);
    setProgress(0);
    setUploadError('');
    try {
      const media = await uploadToR2(file, uploadFolder, setProgress, {
        entityType: relatedEntityType,
        entityId: relatedEntityId,
      });
      setUploaded(media);
      setPreviewFailed(false);
      onChange(media.public_url);
      onUploaded?.(media);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="label">{label}{required && ' *'}</label>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => { onChange(event.target.value); setUploaded(null); setPreviewFailed(false); }}
          className={`input flex-1 ${value && !isValid ? 'border-red-300 focus:ring-red-200' : ''}`}
          placeholder={placeholder || 'https://media.familypledge.org/…'}
        />
        {uploadFolder && (
          <label className={`btn-secondary flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${uploading ? 'opacity-60 pointer-events-none' : ''}`} title="Upload directly to Cloudflare R2">
            <Upload size={14} /> {uploading ? `${progress}%` : 'Upload'}
            <input
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              className="hidden" onChange={handleFileUpload} disabled={uploading}
            />
          </label>
        )}
      </div>
      {uploading && <div className="h-1.5 overflow-hidden rounded bg-gray-100"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>}
      {value && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {isValid ? <a href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-700"><ExternalLink size={11} /> Open media</a> : <span className="text-red-600">Enter a valid HTTPS URL.</span>}
          {uploaded && <span className="inline-flex items-center gap-1 text-gray-500"><FileCheck2 size={11} /> {uploaded.object_key} · {readableBytes(uploaded.size_bytes)}</span>}
        </div>
      )}
      {uploadError && <p role="alert" className="text-xs text-red-600">{uploadError}</p>}
      {showPreview && value && isImage && isValid && !previewFailed && (
        <img src={value} alt="Uploaded media preview" loading="lazy" className="mt-1 h-24 w-auto max-w-full rounded-lg object-cover border border-gray-200" onError={() => setPreviewFailed(true)} />
      )}
      {previewFailed && <p className="text-xs text-amber-700">Preview unavailable. The saved link can still be opened.</p>}
      <p className="text-xs text-gray-400 leading-relaxed">{hint || 'Upload images, videos, audio, PDFs, or documents directly to Cloudflare R2, or enter an HTTPS URL.'}</p>
    </div>
  );
}
