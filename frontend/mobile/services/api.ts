import axios, { AxiosInstance, AxiosError } from 'axios';
import { Config } from '../constants/config';
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
    const msg = (error.response?.data as any)?.message || error.message;
    throw new Error(msg);
  }
  throw error;
};

// ── Auth ──────────────────────────────────────────────────────────────────────

export const register = async (payload: RegisterPayload): Promise<AuthTokens> => {
  try {
    const { data } = await client.post<ApiResponse<AuthTokens>>('/auth/register', payload);
    return data.data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const login = async (payload: LoginPayload): Promise<AuthTokens> => {
  try {
    const { data } = await client.post<ApiResponse<AuthTokens>>('/auth/login', payload);
    return data.data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const getMe = async (): Promise<User> => {
  try {
    const { data } = await client.get<ApiResponse<User>>('/auth/me');
    return data.data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const savePushToken = async (expoPushToken: string): Promise<void> => {
  try {
    await client.post('/auth/save-push-token', { token: expoPushToken });
  } catch (e) {
    // Non-critical — fail silently
  }
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const getDashboard = async (): Promise<Dashboard> => {
  try {
    const { data } = await client.get<ApiResponse<Dashboard>>('/dashboard');
    return data.data;
  } catch (e) {
    return handleApiError(e);
  }
};

// ── Pledges ───────────────────────────────────────────────────────────────────

export const createPledge = async (): Promise<Pledge> => {
  try {
    const { data } = await client.post<ApiResponse<Pledge>>('/pledges');
    return data.data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const getPledgeStatus = async (): Promise<{
  pledge: Pledge | null;
  history: Pledge[];
}> => {
  try {
    const { data } = await client.get<ApiResponse<{ pledge: Pledge | null; history: Pledge[] }>>('/pledges/status');
    return data.data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const updateAnonymousPreference = async (anonymous: boolean): Promise<User> => {
  try {
    const { data } = await client.patch<ApiResponse<User>>('/auth/me', {
      anonymous_publicly: anonymous,
    });
    return data.data;
  } catch (e) {
    return handleApiError(e);
  }
};

// ── Contributions ─────────────────────────────────────────────────────────────

export const submitContribution = async (payload: ContributionPayload): Promise<void> => {
  try {
    await client.post('/contributions', payload);
  } catch (e) {
    return handleApiError(e);
  }
};

// ── Campaigns ─────────────────────────────────────────────────────────────────

export const getCampaigns = async (type?: string): Promise<Campaign[]> => {
  try {
    const params = type && type !== 'all' ? { type } : {};
    const { data } = await client.get<ApiResponse<Campaign[]>>('/campaigns', { params });
    return data.data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const getCampaignById = async (id: string): Promise<Campaign> => {
  try {
    const { data } = await client.get<ApiResponse<Campaign>>(`/campaigns/${id}`);
    return data.data;
  } catch (e) {
    return handleApiError(e);
  }
};

// ── Projects ──────────────────────────────────────────────────────────────────

export const getProjects = async (): Promise<ImpactCard[]> => {
  try {
    const { data } = await client.get<ApiResponse<ImpactCard[]>>('/projects');
    return data.data;
  } catch (e) {
    return handleApiError(e);
  }
};

// ── Impact ────────────────────────────────────────────────────────────────────

export const getImpactCards = async (): Promise<ImpactCard[]> => {
  try {
    const { data } = await client.get<ApiResponse<ImpactCard[]>>('/impact');
    return data.data;
  } catch (e) {
    return handleApiError(e);
  }
};

// ── Reminders ─────────────────────────────────────────────────────────────────

export const getDailyReminders = async (): Promise<Reminder[]> => {
  try {
    const { data } = await client.get<ApiResponse<Reminder[]>>('/reminders/today');
    return data.data;
  } catch (e) {
    return handleApiError(e);
  }
};

// ── NAMLEF Content ────────────────────────────────────────────────────────────

export const getNamlefContent = async (): Promise<NamlefContent[]> => {
  try {
    const { data } = await client.get<ApiResponse<NamlefContent[]>>('/namlef/content');
    return data.data;
  } catch (e) {
    return handleApiError(e);
  }
};

// ── Collector ─────────────────────────────────────────────────────────────────

export const getCollectorDashboard = async (): Promise<CollectorDashboard> => {
  try {
    const { data } = await client.get<ApiResponse<CollectorDashboard>>('/collector/dashboard');
    return data.data;
  } catch (e) {
    return handleApiError(e);
  }
};

export default client;
