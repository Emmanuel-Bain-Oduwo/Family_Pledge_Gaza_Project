import { getToken } from './auth';
import type { MediaFolder } from '../components/MediaUrlInput';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.familypledge.org/api/v1').replace(/\/+$/, '');

export interface UploadedMedia {
  public_url: string;
  object_key: string;
  content_type: string;
  size_bytes: number;
}

interface PresignedUpload extends UploadedMedia {
  upload_url: string;
  method: 'PUT';
  required_headers: Record<string, string>;
  bucket: string;
}

async function apiRequest<T>(path: string, body?: object): Promise<T> {
  const token = getToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { detail?: string }).detail || 'Upload failed. Please try again.');
  }
  return response.json() as Promise<T>;
}

function putFile(
  signed: PresignedUpload,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(signed.method, signed.upload_url);
    Object.entries(signed.required_headers).forEach(([name, value]) => request.setRequestHeader(name, value));
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => request.status >= 200 && request.status < 300
      ? resolve()
      : reject(new Error('Upload failed. Please try again.'));
    request.onerror = () => reject(new Error('Upload failed. Please try again.'));
    request.send(file);
  });
}

export async function uploadToR2(
  file: File,
  folder: MediaFolder,
  onProgress?: (percent: number) => void,
  relation?: { entityType?: string; entityId?: string },
): Promise<UploadedMedia> {
  const signed = await apiRequest<PresignedUpload>('/admin/storage/r2-presigned-upload', {
    folder,
    filename: file.name,
    content_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
  });
  await putFile(signed, file, onProgress);
  await apiRequest('/admin/storage/r2-confirm-upload', {
    object_key: signed.object_key,
    public_url: signed.public_url,
    original_filename: file.name,
    content_type: signed.content_type,
    size_bytes: file.size,
    folder,
    related_entity_type: relation?.entityType || null,
    related_entity_id: relation?.entityId || null,
  });
  return {
    public_url: signed.public_url,
    object_key: signed.object_key,
    content_type: signed.content_type,
    size_bytes: signed.size_bytes,
  };
}
