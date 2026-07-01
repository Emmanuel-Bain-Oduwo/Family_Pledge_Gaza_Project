import axios, { AxiosInstance } from 'axios';
import { getToken } from './auth';
import {
  Admin, AuthTokens, Donor, Contribution, ContributionStatus,
  Campaign, Project, ImpactCard, Reminder, Collector, CollectorMember,
  NamlefContent, PushNotification, DashboardStats, AiDraft, AppSettings,
  PaginatedResponse,
} from '../types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.familypledge.org/api/v1';

const unwrap = <T>(payload: T | { data: T }): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const handle = (e: unknown): never => {
  if (axios.isAxiosError(e)) {
    const msg = (e.response?.data as any)?.detail || (e.response?.data as any)?.message || e.message;
    throw new Error(msg);
  }
  throw e;
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const adminLogin = async (payload: { email: string; password: string }): Promise<AuthTokens> => {
  try {
    const { data } = await client.post<AuthTokens>('/auth/login', { identifier: payload.email, password: payload.password });
    return data;
  } catch (e) { return handle(e); }
};

export const getAdminMe = async (): Promise<Admin> => {
  try {
    const { data } = await client.get<Admin>('/auth/me');
    return data;
  } catch (e) { return handle(e); }
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const { data } = await client.get<DashboardStats>('/admin/dashboard');
    return data;
  } catch (e) { return handle(e); }
};

// ── Donors ────────────────────────────────────────────────────────────────────
export const getDonors = async (params?: Record<string, string>): Promise<{ items: Donor[]; data: Donor[]; total: number }> => {
  try {
    const { data } = await client.get<{ items: Donor[]; total: number }>('/admin/donors', { params });
    return { ...data, data: data.items };
  } catch (e) { return handle(e); }
};

// ── Contributions ─────────────────────────────────────────────────────────────
export const getContributions = async (params?: Record<string, string>): Promise<{ items: Contribution[]; data: Contribution[]; total: number }> => {
  try {
    const { data } = await client.get<{ items: Contribution[]; total: number }>('/admin/contributions', { params });
    return { ...data, data: data.items };
  } catch (e) { return handle(e); }
};

export const reviewContribution = async (
  id: string,
  payload: { status: ContributionStatus; admin_note?: string }
): Promise<Contribution> => {
  try {
    const { data } = await client.patch<Contribution | { data: Contribution }>(`/admin/contributions/${id}/review`, payload);
    return unwrap(data);
  } catch (e) { return handle(e); }
};

export const confirmContribution = async (id: string): Promise<Contribution> => {
  try {
    const { data } = await client.patch<Contribution | { data: Contribution }>(`/admin/contributions/${id}/confirm`);
    return unwrap(data);
  } catch (e) { return handle(e); }
};

export const rejectContribution = async (id: string, admin_note?: string): Promise<Contribution> => {
  try {
    const { data } = await client.patch<Contribution | { data: Contribution }>(`/admin/contributions/${id}/reject`, { admin_note });
    return unwrap(data);
  } catch (e) { return handle(e); }
};

// ── Campaigns ─────────────────────────────────────────────────────────────────
export const getCampaigns = async (params?: Record<string, string>): Promise<Campaign[]> => {
  try {
    const { data } = await client.get<{ items: Campaign[] }>('/campaigns', { params });
    return data.items || [];
  } catch (e) { return handle(e); }
};

export const createCampaign = async (payload: Partial<Campaign>): Promise<Campaign> => {
  try {
    const { data } = await client.post<Campaign | { data: Campaign }>('/admin/campaigns', payload);
    return unwrap(data);
  } catch (e) { return handle(e); }
};

export const updateCampaign = async (id: string, payload: Partial<Campaign>): Promise<Campaign> => {
  try {
    const { data } = await client.patch<Campaign | { data: Campaign }>(`/admin/campaigns/${id}`, payload);
    return unwrap(data);
  } catch (e) { return handle(e); }
};

export const deleteCampaign = async (id: string): Promise<void> => {
  try {
    await client.delete(`/admin/campaigns/${id}`);
  } catch (e) { return handle(e); }
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const getProjects = async (): Promise<Project[]> => {
  try {
    const { data } = await client.get<{ items: Project[] }>('/projects');
    return data.items || [];
  } catch (e) { return handle(e); }
};

export const createProject = async (payload: Partial<Project>): Promise<Project> => {
  try {
    const { data } = await client.post<Project | { data: Project }>('/admin/projects', payload);
    return unwrap(data);
  } catch (e) { return handle(e); }
};

export const updateProject = async (id: string, payload: Partial<Project>): Promise<Project> => {
  try {
    const { data } = await client.patch<Project | { data: Project }>(`/admin/projects/${id}`, payload);
    return unwrap(data);
  } catch (e) { return handle(e); }
};

// ── Impact ────────────────────────────────────────────────────────────────────
export const getImpactCards = async (): Promise<ImpactCard[]> => {
  try {
    const { data } = await client.get<{ items: ImpactCard[] }>('/impact-cards');
    return data.items || [];
  } catch (e) { return handle(e); }
};

export const createImpactCard = async (payload: Partial<ImpactCard>): Promise<ImpactCard> => {
  try {
    const { data } = await client.post<ImpactCard | { data: ImpactCard }>('/admin/impact-cards', payload);
    return unwrap(data);
  } catch (e) { return handle(e); }
};

export const updateImpactCard = async (id: string, payload: Partial<ImpactCard>): Promise<ImpactCard> => {
  try {
    const { data } = await client.patch<ImpactCard | { data: ImpactCard }>(`/admin/impact-cards/${id}`, payload);
    return unwrap(data);
  } catch (e) { return handle(e); }
};

// ── Reminders ─────────────────────────────────────────────────────────────────
export const getReminders = async (params?: Record<string, string>): Promise<Reminder[]> => {
  try {
    const { data } = await client.get<Reminder[]>('/daily-reminders', { params });
    return Array.isArray(data) ? data : [];
  } catch (e) { return handle(e); }
};

export const createReminder = async (payload: Partial<Reminder>): Promise<Reminder> => {
  try {
    const { data } = await client.post<Reminder | { data: Reminder }>('/admin/daily-reminders', payload);
    return unwrap(data);
  } catch (e) { return handle(e); }
};

export const updateReminder = async (id: string, payload: Partial<Reminder>): Promise<Reminder> => {
  try {
    const { data } = await client.patch<Reminder | { data: Reminder }>(`/admin/daily-reminders/${id}`, payload);
    return unwrap(data);
  } catch (e) { return handle(e); }
};

export const publishReminder = async (id: string): Promise<Reminder> => {
  try {
    const { data } = await client.patch<Reminder | { data: Reminder }>(`/admin/daily-reminders/${id}/publish`);
    return unwrap(data);
  } catch (e) { return handle(e); }
};

// ── Collectors ────────────────────────────────────────────────────────────────
export const getCollectors = async (): Promise<Collector[]> => {
  try {
    const { data } = await client.get<{ items: Collector[] }>('/admin/collectors');
    return data.items || [];
  } catch (e) { return handle(e); }
};

export const getCollectorMembers = async (id: string): Promise<CollectorMember[]> => {
  try {
    const { data } = await client.get<CollectorMember[] | { data: CollectorMember[] }>(`/admin/collectors/${id}/members`);
    return unwrap(data);
  } catch (e) { return handle(e); }
};

export const createCollector = async (payload: { user_id: string }): Promise<Collector> => {
  try {
    const { data } = await client.post<Collector | { data: Collector }>('/admin/collectors', payload);
    return unwrap(data);
  } catch (e) { return handle(e); }
};

// ── NAMLEF Content ────────────────────────────────────────────────────────────
export const getNamlefContent = async (): Promise<NamlefContent[]> => {
  try {
    const { data } = await client.get<{ items: NamlefContent[] }>('/namlef-content');
    return data.items || [];
  } catch (e) { return handle(e); }
};

export const createNamlefContent = async (payload: Partial<NamlefContent>): Promise<NamlefContent> => {
  try {
    const { data } = await client.post<NamlefContent | { data: NamlefContent }>('/admin/namlef-content', payload);
    return unwrap(data);
  } catch (e) { return handle(e); }
};

export const updateNamlefContent = async (id: string, payload: Partial<NamlefContent>): Promise<NamlefContent> => {
  try {
    const { data } = await client.patch<NamlefContent | { data: NamlefContent }>(`/admin/namlef-content/${id}`, payload);
    return unwrap(data);
  } catch (e) { return handle(e); }
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = async (): Promise<PushNotification[]> => {
  try {
    const { data } = await client.get<PaginatedResponse<PushNotification> | PushNotification[]>('/admin/notifications');
    return Array.isArray(data) ? data : data.data;
  } catch (e) { return handle(e); }
};

export const sendNotification = async (payload: {
  title: string;
  body: string;
  notification_type: string;
  audience: string;
}): Promise<PushNotification> => {
  try {
    const { data } = await client.post<PushNotification | { data: PushNotification }>('/admin/notifications/send', payload);
    return unwrap(data);
  } catch (e) { return handle(e); }
};

// ── AI Assistant ──────────────────────────────────────────────────────────────

export interface AiReminderPayload {
  audience?: string;
  campaign_title?: string;
  campaign_goal?: string;
  donor_progress?: string;
  tone?: 'warm' | 'formal' | 'concise' | 'motivational';
  language?: string;
  key_points?: string[];
  max_length?: number;
}

export interface AiImpactPayload {
  project_title: string;
  category?: string;
  verified_facts?: string[];
  beneficiaries_count?: number;
  completed_date?: string;
  call_to_action?: string;
  tone?: 'warm' | 'formal' | 'concise' | 'motivational';
  language?: string;
}

export interface AiCollectorPayload {
  collector_name?: string;
  group_name: string;
  registered_count?: number;
  contributed_count?: number;
  pending_count?: number;
  campaign_title?: string;
  tone?: 'warm' | 'formal' | 'concise' | 'motivational';
  language?: string;
}

export const generateReminderDraft = async (payload: AiReminderPayload): Promise<AiDraft> => {
  try {
    const { data } = await client.post<AiDraft>('/admin/ai/reminder-draft', payload);
    return data;
  } catch (e) { return handle(e); }
};

export const generateImpactDraft = async (payload: AiImpactPayload): Promise<AiDraft> => {
  try {
    const { data } = await client.post<AiDraft>('/admin/ai/impact-update-draft', payload);
    return data;
  } catch (e) { return handle(e); }
};

export const generateWeeklySummary = async (date_range?: string): Promise<AiDraft> => {
  try {
    const { data } = await client.post<AiDraft>('/admin/ai/weekly-summary', { date_range });
    return data;
  } catch (e) { return handle(e); }
};

export const generateCollectorMessage = async (payload: AiCollectorPayload): Promise<AiDraft> => {
  try {
    const { data } = await client.post<AiDraft>('/admin/ai/collector-message-draft', payload);
    return data;
  } catch (e) { return handle(e); }
};

export const getAiDrafts = async (params?: {
  page?: number;
  size?: number;
  draft_type?: string;
  status?: string;
}): Promise<{ items: AiDraft[]; total: number; page: number; size: number; pages: number }> => {
  try {
    const { data } = await client.get('/admin/ai/drafts', { params });
    return data;
  } catch (e) { return handle(e); }
};

export const approveAiDraft = async (id: string): Promise<AiDraft> => {
  try {
    const { data } = await client.patch<AiDraft>(`/admin/ai/drafts/${id}/approve`);
    return data;
  } catch (e) { return handle(e); }
};

export const rejectAiDraft = async (id: string): Promise<AiDraft> => {
  try {
    const { data } = await client.patch<AiDraft>(`/admin/ai/drafts/${id}/reject`);
    return data;
  } catch (e) { return handle(e); }
};

export const publishAiDraft = async (id: string): Promise<AiDraft> => {
  try {
    const { data } = await client.patch<AiDraft>(`/admin/ai/drafts/${id}/publish`);
    return data;
  } catch (e) { return handle(e); }
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const getSettings = async (): Promise<AppSettings> => {
  try {
    const { data } = await client.get<AppSettings | { data: AppSettings }>('/admin/settings');
    return unwrap(data);
  } catch (e) { return handle(e); }
};

export const updateSettings = async (payload: Partial<AppSettings>): Promise<AppSettings> => {
  try {
    const { data } = await client.put<AppSettings | { data: AppSettings }>('/admin/settings', payload);
    return unwrap(data);
  } catch (e) { return handle(e); }
};
