import axios from 'axios';
import { getToken, removeToken } from './auth';
import { getApiErrorMessage } from './apiError';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.familypledgekenya.org/api/v1').replace(/\/+$/, '');

export interface AdminSupportMessage {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved';
  admin_response?: string | null;
  responded_at?: string | null;
  created_at: string;
  updated_at: string;
  user_display_name?: string | null;
  user_email?: string | null;
  user_phone?: string | null;
}

const api = axios.create({ baseURL: BASE_URL, timeout: 20000 });
api.interceptors.request.use(config => { const token = getToken(); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
api.interceptors.response.use(r => r, error => { if (error?.response?.status === 401 || error?.response?.status === 403) removeToken(); return Promise.reject(error); });

export async function getSupportMessages(status?: string): Promise<AdminSupportMessage[]> {
  try { const { data } = await api.get<AdminSupportMessage[]>('/admin/support/messages', { params: status ? { status } : undefined }); return data; }
  catch (error) { throw new Error(getApiErrorMessage(error, 'Could not load support messages.')); }
}

export async function updateSupportMessage(id: string, payload: { status?: string; admin_response?: string }): Promise<AdminSupportMessage> {
  try { const { data } = await api.patch<AdminSupportMessage>(`/admin/support/messages/${id}`, payload); return data; }
  catch (error) { throw new Error(getApiErrorMessage(error, 'Could not update this support message.')); }
}
