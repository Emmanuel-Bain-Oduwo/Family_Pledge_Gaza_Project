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
  PaginatedResponse,
  PledgeStatusOut,
  UserNotification,
  EngagementGoal,
  ImpactJourney,
  Achievement,
  PledgeCircle,
} from '../types';

const client: AxiosInstance = axios.create({
  baseURL: Config.API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

client.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
client.interceptors.response.use((response) => response, (error: AxiosError) => Promise.reject(error));

const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as any)?.detail || (error.response?.data as any)?.message || error.message;
    throw new Error(msg);
  }
  throw error;
};

const optionalTrimmed = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const register = async (payload: RegisterPayload): Promise<AuthTokens> => {
  const normalized = {
    full_name: payload.full_name.trim(), phone: payload.phone.trim(),
    email: optionalTrimmed(payload.email), password: payload.password,
    country: payload.country.trim(), city: optionalTrimmed(payload.city),
    nickname: optionalTrimmed(payload.nickname), referral_code: optionalTrimmed(payload.referral_code),
  };
  try { return (await client.post<AuthTokens>('/auth/register', normalized)).data; }
  catch (e) { return handleApiError(e); }
};

export const login = async (payload: LoginPayload): Promise<AuthTokens> => {
  try { return (await client.post<AuthTokens>('/auth/login', { identifier: payload.phone_or_email.trim(), password: payload.password })).data; }
  catch (e) { return handleApiError(e); }
};

export const getMe = async (): Promise<User> => {
  try { return (await client.get<User>('/users/me')).data; }
  catch (e) { return handleApiError(e); }
};

export const savePushToken = async (expoPushToken: string): Promise<void> => {
  try { await client.post('/auth/save-push-token', { push_token: expoPushToken }); } catch {}
};

export const getDashboard = async (): Promise<Dashboard> => {
  try { return (await client.get<Dashboard>('/dashboard')).data; }
  catch (e) { return handleApiError(e); }
};

export const createPledge = async (payload: { pledge_type?: string; amount?: number; currency?: string; start_date: string; agreement_accepted?: boolean }): Promise<Pledge> => {
  try { return (await client.post<Pledge>('/pledges', payload)).data; }
  catch (e) { return handleApiError(e); }
};
export const updatePledge = async (id: string, payload: { amount?: number; status?: string }): Promise<Pledge> => {
  try { return (await client.patch<Pledge>(`/pledges/${id}`, payload)).data; }
  catch (e) { return handleApiError(e); }
};
export const getMyPledges = async (): Promise<Pledge[]> => {
  try { return (await client.get<Pledge[]>('/pledges/me')).data; }
  catch (e) { return handleApiError(e); }
};
export const getPledgeStatus = async (): Promise<PledgeStatusOut> => {
  try { return (await client.get<PledgeStatusOut>('/pledges/me/status')).data; }
  catch (e) { return handleApiError(e); }
};
export const updateAnonymousPreference = async (anonymous: boolean): Promise<User> => {
  try { return (await client.patch<User>('/users/me/anonymous', { anonymous_publicly: anonymous })).data; }
  catch (e) { return handleApiError(e); }
};

export const submitContribution = async (payload: ContributionPayload): Promise<void> => {
  const normalized = {
    pledge_id: payload.pledge_id, campaign_id: payload.campaign_id, amount: payload.amount,
    currency: payload.currency, contribution_channel: payload.contribution_channel || payload.payment_method,
    payment_link_used: payload.payment_link_used,
    transaction_reference: payload.transaction_reference || payload.reference,
    proof_object_key: payload.proof_object_key,
    proof_image_url: payload.proof_image_url || payload.proof_url,
    contribution_month: payload.contribution_month || currentContributionMonth(),
  };
  try { await client.post('/contributions/submit', normalized); }
  catch (e) { return handleApiError(e); }
};

export const uploadContributionProof = async (asset: { uri: string; fileName?: string | null; mimeType?: string | null; fileSize?: number; }): Promise<string> => {
  const filename = asset.fileName || `payment-proof-${Date.now()}.jpg`;
  const contentType = asset.mimeType || 'image/jpeg';
  const fileResponse = await fetch(asset.uri);
  const blob = await fileResponse.blob();
  const sizeBytes = asset.fileSize || blob.size;
  try {
    const { data } = await client.post('/admin/storage/contribution-proof/presigned-upload', {
      folder: 'contribution_proofs', filename, content_type: contentType, size_bytes: sizeBytes,
    });
    const uploaded = await fetch(data.upload_url, { method: 'PUT', headers: data.required_headers, body: blob });
    if (!uploaded.ok) throw new Error('The screenshot could not be uploaded.');
    const confirmed = await client.post('/admin/storage/contribution-proof/confirm-upload', { object_key: data.object_key });
    return confirmed.data.object_key as string;
  } catch (e) { return handleApiError(e); }
};

export const getMyContributions = async (page = 1): Promise<PaginatedResponse<any>> => {
  try { return (await client.get<PaginatedResponse<any>>('/contributions/me', { params: { page } })).data; }
  catch (e) { return handleApiError(e); }
};

export const getCampaigns = async (type?: string): Promise<Campaign[]> => {
  try {
    const params = type && type !== 'all' ? { campaign_type: type } : {};
    return (await client.get<PaginatedResponse<Campaign>>('/campaigns', { params })).data.items || [];
  } catch (e) { return handleApiError(e); }
};
export const getActiveCampaigns = async (): Promise<Campaign[]> => {
  try { return (await client.get<Campaign[]>('/campaigns/active')).data; }
  catch (e) { return handleApiError(e); }
};
export const getCampaignById = async (id: string): Promise<Campaign> => {
  try { return (await client.get<Campaign>(`/campaigns/${id}`)).data; }
  catch (e) { return handleApiError(e); }
};

export const getProjects = async (): Promise<ImpactCard[]> => {
  try { return (await client.get<PaginatedResponse<ImpactCard>>('/projects')).data.items || []; }
  catch (e) { return handleApiError(e); }
};
export const getImpactCards = async (): Promise<ImpactCard[]> => {
  try { return (await client.get<PaginatedResponse<ImpactCard>>('/impact-cards')).data.items || []; }
  catch (e) { return handleApiError(e); }
};

export const getDailyReminders = async (): Promise<Reminder[]> => {
  try { const data = (await client.get<Reminder[]>('/daily-reminders')).data; return Array.isArray(data) ? data : []; }
  catch (e) { return handleApiError(e); }
};
export const getTodayReminder = async (): Promise<Reminder | null> => {
  try { return (await client.get<Reminder | null>('/daily-reminders/today')).data; }
  catch { return null; }
};
export const getNamlefContent = async (): Promise<NamlefContent[]> => {
  try { return (await client.get<PaginatedResponse<NamlefContent>>('/namlef-content')).data.items || []; }
  catch (e) { return handleApiError(e); }
};
export const getNotifications = async (): Promise<UserNotification[]> => {
  try { return (await client.get<PaginatedResponse<UserNotification>>('/notifications', { params: { size: 50 } })).data.items || []; }
  catch (e) { return handleApiError(e); }
};
export const getCollectorDashboard = async (): Promise<CollectorDashboard> => {
  try { return (await client.get<CollectorDashboard>('/collectors/me/dashboard')).data; }
  catch (e) { return handleApiError(e); }
};

// ── Engagement journey, goals and circles ────────────────────────────────────
export const getImpactJourney = async (): Promise<ImpactJourney> => {
  try { return (await client.get<ImpactJourney>('/engagement/journey')).data; }
  catch (e) { return handleApiError(e); }
};
export const getAchievements = async (): Promise<Achievement[]> => {
  try { return (await client.get<Achievement[]>('/engagement/achievements')).data; }
  catch (e) { return handleApiError(e); }
};
export const getGoals = async (): Promise<EngagementGoal[]> => {
  try { return (await client.get<EngagementGoal[]>('/engagement/goals')).data; }
  catch (e) { return handleApiError(e); }
};
export const createGoal = async (payload: { goal_type: string; title: string; target_count: number; cadence: string }): Promise<EngagementGoal> => {
  try { return (await client.post<EngagementGoal>('/engagement/goals', payload)).data; }
  catch (e) { return handleApiError(e); }
};
export const updateGoal = async (id: string, payload: Partial<EngagementGoal>): Promise<EngagementGoal> => {
  try { return (await client.patch<EngagementGoal>(`/engagement/goals/${id}`, payload)).data; }
  catch (e) { return handleApiError(e); }
};
export const recordEngagementEvent = async (event_type: string, entity_type?: string, entity_id?: string): Promise<void> => {
  try { await client.post('/engagement/events', { event_type, entity_type, entity_id }); }
  catch { /* analytics/progress tracking should never block the user's primary action */ }
};
export const getPledgeCircles = async (): Promise<PledgeCircle[]> => {
  try { return (await client.get<PledgeCircle[]>('/engagement/circles')).data; }
  catch (e) { return handleApiError(e); }
};
export const createPledgeCircle = async (payload: { name: string; description?: string }): Promise<PledgeCircle> => {
  try { return (await client.post<PledgeCircle>('/engagement/circles', payload)).data; }
  catch (e) { return handleApiError(e); }
};
export const joinPledgeCircle = async (code: string): Promise<PledgeCircle> => {
  try { return (await client.post<PledgeCircle>('/engagement/circles/join', { code })).data; }
  catch (e) { return handleApiError(e); }
};
export const getPledgeCircle = async (id: string): Promise<PledgeCircle> => {
  try { return (await client.get<PledgeCircle>(`/engagement/circles/${id}`)).data; }
  catch (e) { return handleApiError(e); }
};
export const leavePledgeCircle = async (id: string): Promise<void> => {
  try { await client.delete(`/engagement/circles/${id}/leave`); }
  catch (e) { return handleApiError(e); }
};
export const submitFeatureRequest = async (title: string, description: string): Promise<void> => {
  try { await client.post('/engagement/feature-requests', { title, description }); }
  catch (e) { return handleApiError(e); }
};

export default client;
