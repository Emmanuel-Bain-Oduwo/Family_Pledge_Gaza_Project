import axios, { AxiosInstance, AxiosError } from 'axios';
import { Config } from '../constants/config';
import { currentContributionMonth } from '../constants/payment';
import { getToken } from './auth';
import {
  User,
  Dashboard,
  Campaign,
  ImpactCard,
  Reminder,
  NamlefContent,
  CollectorDashboard,
  RegisterPayload,
  LoginPayload,
  ContributionPayload,
  AuthTokens,
  Pledge,
  ApiResponse,
  PaginatedResponse,
  PledgeStatusOut,
} from '../types';

const client: AxiosInstance = axios.create({
  baseURL: Config.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

client.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as any)?.detail || (error.response?.data as any)?.message || error.message;
    throw new Error(msg);
  }
  throw error;
};

// ── Auth ──────────────────────────────────────────────────────────────────────

const optionalTrimmed = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const register = async (payload: RegisterPayload): Promise<AuthTokens> => {
  const normalized = {
    full_name: payload.full_name.trim(),
    phone: payload.phone.trim(),
    email: optionalTrimmed(payload.email),
    password: payload.password,
    country: payload.country.trim(),
    city: optionalTrimmed(payload.city),
    nickname: optionalTrimmed(payload.nickname),
  };

  try {
    const { data } = await client.post<AuthTokens>('/auth/register', normalized);
    return data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const login = async (payload: LoginPayload): Promise<AuthTokens> => {
  const normalized = {
    identifier: payload.phone_or_email.trim(),
    password: payload.password,
  };

  try {
    const { data } = await client.post<AuthTokens>('/auth/login', normalized);
    return data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const getMe = async (): Promise<User> => {
  try {
    const { data } = await client.get<User>('/users/me');
    return data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const savePushToken = async (expoPushToken: string): Promise<void> => {
  try {
    await client.post('/auth/save-push-token', { push_token: expoPushToken });
  } catch {
    // Non-critical — fail silently
  }
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const getDashboard = async (): Promise<Dashboard> => {
  try {
    const { data } = await client.get<Dashboard>('/dashboard');
    return data;
  } catch (e) {
    return handleApiError(e);
  }
};

// ── Pledges ───────────────────────────────────────────────────────────────────

export const createPledge = async (payload: { pledge_type?: string; amount?: number; currency?: string; start_date: string }): Promise<Pledge> => {
  try {
    const { data } = await client.post<Pledge>('/pledges', payload);
    return data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const updatePledge = async (id: string, payload: { amount?: number; status?: string }): Promise<Pledge> => {
  try {
    const { data } = await client.patch<Pledge>(`/pledges/${id}`, payload);
    return data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const getMyPledges = async (): Promise<Pledge[]> => {
  try {
    const { data } = await client.get<Pledge[]>('/pledges/me');
    return data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const getPledgeStatus = async (): Promise<PledgeStatusOut> => {
  try {
    const { data } = await client.get<PledgeStatusOut>('/pledges/me/status');
    return data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const updateAnonymousPreference = async (anonymous: boolean): Promise<User> => {
  try {
    const { data } = await client.patch<User>('/users/me/anonymous', {
      anonymous_publicly: anonymous,
    });
    return data;
  } catch (e) {
    return handleApiError(e);
  }
};

// ── Contributions ─────────────────────────────────────────────────────────────

export const submitContribution = async (payload: ContributionPayload): Promise<void> => {
  const normalized = {
    pledge_id: payload.pledge_id,
    campaign_id: payload.campaign_id,
    amount: payload.amount,
    currency: payload.currency,
    contribution_channel: payload.contribution_channel || payload.payment_method,
    payment_link_used: payload.payment_link_used,
    transaction_reference: payload.transaction_reference || payload.reference,
    proof_image_url: payload.proof_image_url || payload.proof_url,
    contribution_month: payload.contribution_month || currentContributionMonth(),
  };
  try {
    await client.post('/contributions/submit', normalized);
  } catch (e) {
    return handleApiError(e);
  }
};

export const getMyContributions = async (page = 1): Promise<PaginatedResponse<any>> => {
  try {
    const { data } = await client.get<PaginatedResponse<any>>('/contributions/me', { params: { page } });
    return data;
  } catch (e) {
    return handleApiError(e);
  }
};

// ── Campaigns ─────────────────────────────────────────────────────────────────

export const getCampaigns = async (type?: string): Promise<Campaign[]> => {
  try {
    const params = type && type !== 'all' ? { campaign_type: type } : {};
    const { data } = await client.get<PaginatedResponse<Campaign>>('/campaigns', { params });
    return data.items || [];
  } catch (e) {
    return handleApiError(e);
  }
};

export const getActiveCampaigns = async (): Promise<Campaign[]> => {
  try {
    const { data } = await client.get<Campaign[]>('/campaigns/active');
    return data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const getCampaignById = async (id: string): Promise<Campaign> => {
  try {
    const { data } = await client.get<Campaign>(`/campaigns/${id}`);
    return data;
  } catch (e) {
    return handleApiError(e);
  }
};

// ── Projects ──────────────────────────────────────────────────────────────────

export const getProjects = async (): Promise<ImpactCard[]> => {
  try {
    const { data } = await client.get<PaginatedResponse<ImpactCard>>('/projects');
    return data.items || [];
  } catch (e) {
    return handleApiError(e);
  }
};

// ── Impact ────────────────────────────────────────────────────────────────────

export const getImpactCards = async (): Promise<ImpactCard[]> => {
  try {
    const { data } = await client.get<PaginatedResponse<ImpactCard>>('/impact-cards');
    return data.items || [];
  } catch (e) {
    return handleApiError(e);
  }
};

// ── Reminders ─────────────────────────────────────────────────────────────────

export const getDailyReminders = async (): Promise<Reminder[]> => {
  try {
    const { data } = await client.get<Reminder[]>('/daily-reminders');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return handleApiError(e);
  }
};

export const getTodayReminder = async (): Promise<Reminder | null> => {
  try {
    const { data } = await client.get<Reminder | null>('/daily-reminders/today');
    return data;
  } catch (e) {
    return null;
  }
};

// ── NAMLEF Content ────────────────────────────────────────────────────────────

export const getNamlefContent = async (): Promise<NamlefContent[]> => {
  try {
    const { data } = await client.get<PaginatedResponse<NamlefContent>>('/namlef-content');
    return data.items || [];
  } catch (e) {
    return handleApiError(e);
  }
};

// ── Collector ─────────────────────────────────────────────────────────────────

export const getCollectorDashboard = async (): Promise<CollectorDashboard> => {
  try {
    const { data } = await client.get<CollectorDashboard>('/collectors/me/dashboard');
    return data;
  } catch (e) {
    return handleApiError(e);
  }
};

export default client;
