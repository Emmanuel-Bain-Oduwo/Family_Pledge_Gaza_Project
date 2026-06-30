import { getToken } from './auth';
import type { MediaFolder } from '../components/MediaUrlInput';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.familypledge.org/api/v1';

interface CloudinarySignature {
  timestamp: number;
  signature: string;
  cloud_name: string;
  api_key: string;
  upload_folder: string;
  upload_url: string;
}

export async function getCloudinarySignature(folder: MediaFolder): Promise<CloudinarySignature> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/admin/storage/cloudinary-signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ folder }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || 'Failed to get upload signature');
  }
  return res.json();
}

export async function uploadToCloudinary(file: File, folder: MediaFolder): Promise<string> {
  const sig = await getCloudinarySignature(folder);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('timestamp', sig.timestamp.toString());
  formData.append('signature', sig.signature);
  formData.append('api_key', sig.api_key);
  formData.append('folder', sig.upload_folder);
  const res = await fetch(sig.upload_url, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || 'Upload to Cloudinary failed');
  }
  const data = await res.json();
  return (data as any).secure_url as string;
}
