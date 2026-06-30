'use client';
import { useState } from 'react';
import { Upload, ExternalLink } from 'lucide-react';
import { getCloudinarySignature, uploadToCloudinary } from '../lib/media';

const CLOUDINARY_RE = /^https?:\/\/(?:res\.)?cloudinary\.com\//i;
const YOUTUBE_RE =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)[\w-]+/i;
const VIDEO_EXT_RE = /\.(mp4|mov|webm|avi|mkv)([?#]|$)/i;

type UrlType = 'cloudinary' | 'youtube' | 'invalid' | '';

function detectType(url: string): UrlType {
  if (!url) return '';
  if (CLOUDINARY_RE.test(url)) return 'cloudinary';
  if (YOUTUBE_RE.test(url)) return 'youtube';
  return 'invalid';
}

function isCloudinaryImage(url: string) {
  return CLOUDINARY_RE.test(url) && !VIDEO_EXT_RE.test(url);
}

export type MediaFolder =
  | 'projects'
  | 'impact'
  | 'namlef'
  | 'reminders'
  | 'contribution_proofs';

interface MediaUrlInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Which URL types are accepted. Defaults to both. */
  accept?: ('cloudinary' | 'youtube')[];
  /** Show image thumbnail preview for Cloudinary image URLs. Default true. */
  showPreview?: boolean;
  /** Cloudinary folder for the optional direct-upload button. */
  uploadFolder?: MediaFolder;
  required?: boolean;
  hint?: string;
}

export default function MediaUrlInput({
  label,
  value,
  onChange,
  placeholder,
  accept = ['cloudinary', 'youtube'],
  showPreview = true,
  uploadFolder,
  required,
  hint,
}: MediaUrlInputProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const type = detectType(value);
  const isValid = !value || accept.includes(type as 'cloudinary' | 'youtube');
  const showPreviewImg = showPreview && value && isCloudinaryImage(value) && isValid;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadFolder) return;
    setUploading(true);
    setUploadError('');
    try {
      const url = await uploadToCloudinary(file, uploadFolder);
      onChange(url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="label">
        {label}
        {required && ' *'}
      </label>

      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`input flex-1 ${value && !isValid ? 'border-red-300 focus:ring-red-200' : ''}`}
          placeholder={placeholder || 'https://res.cloudinary.com/… or https://youtu.be/…'}
        />
        {uploadFolder && (
          <label
            className={`btn-secondary flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
            title="Upload directly to Cloudinary"
          >
            <Upload size={14} />
            {uploading ? 'Uploading…' : 'Upload'}
            <input
              type="file"
              accept="image/*,video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {/* URL type badge + validation */}
      {value && (
        <div className="flex items-center gap-2">
          {type === 'cloudinary' && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              ✓ Cloudinary
            </span>
          )}
          {type === 'youtube' && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
              <ExternalLink size={10} /> YouTube
            </span>
          )}
          {!isValid && (
            <span className="text-xs text-red-600">
              Invalid URL — use Cloudinary or a YouTube link
            </span>
          )}
          {uploadError && (
            <span className="text-xs text-red-600">{uploadError}</span>
          )}
        </div>
      )}

      {/* Image preview */}
      {showPreviewImg && (
        <img
          src={value}
          alt="Preview"
          className="mt-1 h-24 w-auto max-w-full rounded-lg object-cover border border-gray-200"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-400 leading-relaxed">
        {hint || (
          <>
            Use <span className="font-medium text-gray-500">Cloudinary</span> for images &amp; short videos
            (max 1 MB / 30 s).{' '}
            Use <span className="font-medium text-gray-500">YouTube (unlisted)</span> for Sheikh/NAMLEF talks
            or long videos. Do not upload large videos directly.
          </>
        )}
      </p>
    </div>
  );
}
