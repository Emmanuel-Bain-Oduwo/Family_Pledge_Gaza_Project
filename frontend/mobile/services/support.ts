import api from './api';
import { SupportMessage } from '../types';

export async function createSupportMessage(payload: { subject: string; message: string; category: string }): Promise<SupportMessage> {
  const { data } = await api.post<SupportMessage>('/support/messages', payload);
  return data;
}

export async function getMySupportMessages(): Promise<SupportMessage[]> {
  const { data } = await api.get<SupportMessage[]>('/support/messages/me');
  return Array.isArray(data) ? data : [];
}
