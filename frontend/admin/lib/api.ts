import axios, { AxiosInstance } from 'axios';
import { getToken } from './auth';
import {
  Admin, AuthTokens, Donor, Contribution, ContributionStatus,
  Campaign, Project, ImpactCard, Reminder, Collector, CollectorMember,
  NamlefContent, PushNotification, DashboardStats, AiDraft, AppSettings,
  ApiResponse, PaginatedResponse,
} from '../types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.familypledge.org/api/v1';

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
    const { data } = await client.post<ApiResponse<AuthTokens>>('/admin/auth/login', payload);
    return data.data;
  } catch (e) { return handle(e); }
};

export const getAdminMe = async (): Promise<Admin> => {
  try {
    const { data } = await client.get<ApiResponse<Admin>>('/admin/auth/me');
    return data.data;
  } catch (e) { return handle(e); }
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const { data } = await client.get<ApiResponse<DashboardStats>>('/admin/dashboard');
    return data.data;
  } catch (e) { return handle(e); }
};

// ── Donors ────────────────────────────────────────────────────────────────────
export const getDonors = async (params?: Record<string, string>): Promise<PaginatedResponse<Donor>> => {
  try {
    const { data } = await client.get<ApiResponse<PaginatedResponse<Donor>>>('/admin/donors', { params });
    return data.data;
  } catch (e) { return handle(e); }
};

// ── Contributions ─────────────────────────────────────────────────────────────
export const getContributions = async (params?: Record<string, string>): Promise<PaginatedResponse<Contribution>> => {
  try {
    const { data } = await client.get<ApiResponse<PaginatedResponse<Contribution>>>('/admin/contributions', { params });
    return data.data;
  } catch (e) { return handle(e); }
};

export const reviewContribution = async (
  id: string,
  payload: { status: ContributionStatus; admin_note?: string }
): Promise<Contribution> => {
  try {
    const { data } = await client.patch<ApiResponse<Contribution>>(`/admin/contributions/${id}/review`, payload);
    return data.data;
  } catch (e) { return handle(e); }
};

// ── Campaigns ─────────────────────────────────────────────────────────────────
export const getCampaigns = async (params?: Record<string, string>): Promise<Campaign[]> => {
  try {
    const { data } = await client.get<ApiResponse<Campaign[]>>('/admin/campaigns', { params });
    return data.data;
  } catch (e) { return handle(e); }
};

export const createCampaign = async (payload: Partial<Campaign>): Promise<Campaign> => {
  try {
    const { data } = await client.post<ApiResponse<Campaign>>('/admin/campaigns', payload);
    return data.data;
  } catch (e) { return handle(e); }
};

export const updateCampaign = async (id: string, payload: Partial<Campaign>): Promise<Campaign> => {
  try {
    const { data } = await client.put<ApiResponse<Campaign>>(`/admin/campaigns/${id}`, payload);
    return data.data;
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
    const { data } = await client.get<ApiResponse<Project[]>>('/admin/projects');
    return data.data;
  } catch (e) { return handle(e); }
};

export const createProject = async (payload: Partial<Project>): Promise<Project> => {
  try {
    const { data } = await client.post<ApiResponse<Project>>('/admin/projects', payload);
    return data.data;
  } catch (e) { return handle(e); }
};

export const updateProject = async (id: string, payload: Partial<Project>): Promise<Project> => {
  try {
    const { data } = await client.put<ApiResponse<Project>>(`/admin/projects/${id}`, payload);
    return data.data;
  } catch (e) { return handle(e); }
};

// ── Impact ────────────────────────────────────────────────────────────────────
export const getImpactCards = async (): Promise<ImpactCard[]> => {
  try {
    const { data } = await client.get<ApiResponse<ImpactCard[]>>('/admin/impact');
    return data.data;
  } catch (e) { return handle(e); }
};

export const createImpactCard = async (payload: Partial<ImpactCard>): Promise<ImpactCard> => {
  try {
    const { data } = await client.post<ApiResponse<ImpactCard>>('/admin/impact', payload);
    return data.data;
  } catch (e) { return handle(e); }
};

export const updateImpactCard = async (id: string, payload: Partial<ImpactCard>): Promise<ImpactCard> => {
  try {
    const { data } = await client.put<ApiResponse<ImpactCard>>(`/admin/impact/${id}`, payload);
    return data.data;
  } catch (e) { return handle(e); }
};

// ── Reminders ─────────────────────────────────────────────────────────────────
export const getReminders = async (params?: Record<string, string>): Promise<Reminder[]> => {
  try {
    const { data } = await client.get<ApiResponse<Reminder[]>>('/admin/reminders', { params });
    return data.data;
  } catch (e) { return handle(e); }
};

export const createReminder = async (payload: Partial<Reminder>): Promise<Reminder> => {
  try {
    const { data } = await client.post<ApiResponse<Reminder>>('/admin/reminders', payload);
    return data.data;
  } catch (e) { return handle(e); }
};

export const updateReminder = async (id: string, payload: Partial<Reminder>): Promise<Reminder> => {
  try {
    const { data } = await client.put<ApiResponse<Reminder>>(`/admin/reminders/${id}`, payload);
    return data.data;
  } catch (e) { return handle(e); }
};

export const publishReminder = async (id: string): Promise<Reminder> => {
  try {
    const { data } = await client.patch<ApiResponse<Reminder>>(`/admin/reminders/${id}/publish`);
    return data.data;
  } catch (e) { return handle(e); }
};

// ── Collectors ────────────────────────────────────────────────────────────────
export const getCollectors = async (): Promise<Collector[]> => {
  try {
    const { data } = await client.get<ApiResponse<Collector[]>>('/admin/collectors');
    return data.data;
  } catch (e) { return handle(e); }
};

export const getCollectorMembers = async (id: string): Promise<CollectorMember[]> => {
  try {
    const { data } = await client.get<ApiResponse<CollectorMember[]>>(`/admin/collectors/${id}/members`);
    return data.data;
  } catch (e) { return handle(e); }
};

export const createCollector = async (payload: { user_id: string }): Promise<Collector> => {
  try {
    const { data } = await client.post<ApiResponse<Collector>>('/admin/collectors', payload);
    return data.data;
  } catch (e) { return handle(e); }
};

// ── NAMLEF Content ────────────────────────────────────────────────────────────
export const getNamlefContent = async (): Promise<NamlefContent[]> => {
  try {
    const { data } = await client.get<ApiResponse<NamlefContent[]>>('/admin/namlef/content');
    return data.data;
  } catch (e) { return handle(e); }
};

export const createNamlefContent = async (payload: Partial<NamlefContent>): Promise<NamlefContent> => {
  try {
    const { data } = await client.post<ApiResponse<NamlefContent>>('/admin/namlef/content', payload);
    return data.data;
  } catch (e) { return handle(e); }
};

export const updateNamlefContent = async (id: string, payload: Partial<NamlefContent>): Promise<NamlefContent> => {
  try {
    const { data } = await client.put<ApiResponse<NamlefContent>>(`/admin/namlef/content/${id}`, payload);
    return data.data;
  } catch (e) { return handle(e); }
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = async (): Promise<PushNotification[]> => {
  try {
    const { data } = await client.get<ApiResponse<PushNotification[]>>('/admin/notifications');
    return data.data;
  } catch (e) { return handle(e); }
};

export const sendNotification = async (payload: {
  title: string;
  body: string;
  type: string;
  audience: string;
}): Promise<PushNotification> => {
  try {
    const { data } = await client.post<ApiResponse<PushNotification>>('/admin/notifications/send', payload);
    return data.data;
  } catch (e) { return handle(e); }
};

// ── AI Assistant ──────────────────────────────────────────────────────────────
export const generateReminderDraft = async (payload: Record<string, string>): Promise<AiDraft> => {
  try {
    const { data } = await client.post<ApiResponse<AiDraft>>('/admin/ai/reminder-draft', payload);
    return data.data;
  } catch (e) { return handle(e); }
};

export const generateImpactDraft = async (payload: Record<string, string>): Promise<AiDraft> => {
  try {
    const { data } = await client.post<ApiResponse<AiDraft>>('/admin/ai/impact-update-draft', payload);
    return data.data;
  } catch (e) { return handle(e); }
};

export const generateWeeklySummary = async (): Promise<AiDraft> => {
  try {
    const { data } = await client.post<ApiResponse<AiDraft>>('/admin/ai/weekly-summary');
    return data.data;
  } catch (e) { return handle(e); }
};

export const generateCollectorMessage = async (payload: Record<string, string>): Promise<AiDraft> => {
  try {
    const { data } = await client.post<ApiResponse<AiDraft>>('/admin/ai/collector-message-draft', payload);
    return data.data;
  } catch (e) { return handle(e); }
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const getSettings = async (): Promise<AppSettings> => {
  try {
    const { data } = await client.get<ApiResponse<AppSettings>>('/admin/settings');
    return data.data;
  } catch (e) { return handle(e); }
};

export const updateSettings = async (payload: Partial<AppSettings>): Promise<AppSettings> => {
  try {
    const { data } = await client.put<ApiResponse<AppSettings>>('/admin/settings', payload);
    return data.data;
  } catch (e) { return handle(e); }
};
