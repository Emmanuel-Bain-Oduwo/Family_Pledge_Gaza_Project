import { getToken } from './auth';
import type { MediaFolder } from '../components/MediaUrlInput';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.familypledge.org/api/v1').replace(/\/+$/, '');

export interface UploadedMedia {
  public_url: string;
  object_key: string;
  content_type: string;
  size_bytes: number;
  thumbnail_url?: string;
  storage?: 'r2' | 'stream';
}

interface StreamDirectUpload { upload_url:string; uid:string; playback_url:string; thumbnail_url:string; }

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

async function uploadVideoToStream(file: File, folder: MediaFolder, onProgress?: (percent:number)=>void, relation?: {entityType?:string;entityId?:string}): Promise<UploadedMedia> {
  const signed = await apiRequest<StreamDirectUpload>('/admin/storage/stream-direct-upload', { folder, filename:file.name, size_bytes:file.size, related_entity_type:relation?.entityType||null, related_entity_id:relation?.entityId||null });
  if (file.size <= 190 * 1024 * 1024) {
    await new Promise<void>((resolve,reject)=>{ const xhr=new XMLHttpRequest(); xhr.open('POST',signed.upload_url); xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress?.(Math.round(e.loaded/e.total*100));}; xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(new Error('Video upload failed. Please try again.')); xhr.onerror=()=>reject(new Error('Video upload failed. Please try again.')); const data=new FormData(); data.append('file',file); xhr.send(data); });
  } else {
    const metadata = btoa(unescape(encodeURIComponent(file.name)));
    const created = await fetch(signed.upload_url, { method:'POST', headers:{'Tus-Resumable':'1.0.0','Upload-Length':String(file.size),'Upload-Metadata':`filename ${metadata}` } });
    if (!created.ok || !created.headers.get('Location')) throw new Error('Video upload failed. Please try again.');
    const location = new URL(created.headers.get('Location')!, signed.upload_url).toString();
    const chunkSize=50*1024*1024; let offset=0;
    while(offset<file.size){ const chunk=file.slice(offset,Math.min(offset+chunkSize,file.size)); const response=await fetch(location,{method:'PATCH',headers:{'Tus-Resumable':'1.0.0','Upload-Offset':String(offset),'Content-Type':'application/offset+octet-stream'},body:chunk}); if(!response.ok)throw new Error('Video upload failed. Please try again.'); offset=Number(response.headers.get('Upload-Offset')||offset+chunk.size); onProgress?.(Math.round(offset/file.size*100)); }
  }
  await apiRequest('/admin/storage/stream-confirm-upload', { uid:signed.uid });
  return { public_url:signed.playback_url, object_key:`stream/${signed.uid}`, content_type:file.type||'video/mp4', size_bytes:file.size, thumbnail_url:signed.thumbnail_url, storage:'stream' };
}

export async function uploadToR2(
  file: File,
  folder: MediaFolder,
  onProgress?: (percent: number) => void,
  relation?: { entityType?: string; entityId?: string },
): Promise<UploadedMedia> {
  if (file.type.startsWith('video/')) return uploadVideoToStream(file, folder, onProgress, relation);
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
    storage: 'r2',
  };
}
