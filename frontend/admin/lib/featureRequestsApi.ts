'use client';

import axios from 'axios';
import { getToken, removeToken } from './auth';

const DEFAULT_API_URL = 'https://api.familypledgekenya.org/api/v1';
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

const client = axios.create({ baseURL: BASE_URL, timeout: 20000 });
client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface FeatureRequestItem {
  id: string;
  title: string;
  description: string;
  status: 'new' | 'reviewing' | 'planned' | 'completed' | 'declined';
  created_at: string;
}

function fail(error: unknown): never {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401 || error.response?.status === 403) removeToken();
    const data = error.response?.data as { detail?: string } | undefined;
    throw new Error(data?.detail || error.message);
  }
  throw error;
}

export async function listFeatureRequests(): Promise<FeatureRequestItem[]> {
  try { return (await client.get<FeatureRequestItem[]>('/engagement/feature-requests')).data; }
  catch (error) { return fail(error); }
}

export async function updateFeatureRequestStatus(id: string, status: FeatureRequestItem['status']): Promise<FeatureRequestItem> {
  try { return (await client.patch<FeatureRequestItem>(`/engagement/feature-requests/${id}`, { status })).data; }
  catch (error) { return fail(error); }
}
