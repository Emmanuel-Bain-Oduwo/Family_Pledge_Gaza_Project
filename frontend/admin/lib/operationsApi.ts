'use client';

import axios from 'axios';
import { getToken, removeToken } from './auth';

const DEFAULT_API_URL = 'https://api.familypledgekenya.org/api/v1';
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

const client = axios.create({ baseURL: BASE_URL, timeout: 40000, headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
client.interceptors.request.use((config) => { const token = getToken(); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
function fail(error: unknown): never { if (axios.isAxiosError(error)) { if (error.response?.status === 401 || error.response?.status === 403) removeToken(); const data = error.response?.data as { detail?: string; message?: string } | undefined; throw new Error(data?.detail || data?.message || error.message); } throw error; }

export type DonorSegment = 'all_donors'|'active_pledges'|'missing_this_month'|'pending_review'|'confirmed_this_month'|'inactive_30_days'|'new_this_month'|'collectors';
export type CommunicationChannel = 'app'|'email'|'whatsapp';

export interface CommandCenter {
  total_donors: number; active_pledges: number; missing_this_month: number; pending_review: number;
  needs_follow_up: number; confirmed_this_month: number; inactive_30_days: number; new_this_month: number;
  open_followup_cases: number; scheduled_messages: number; ai_outputs_waiting: number; active_campaigns: number;
  feature_requests_new: number; due_followups_today: number; segment_counts: Record<string, number>;
}

export interface OperationsDonor {
  id: string; donor_number: number; full_name?: string|null; nickname?: string|null; country?: string|null; city?: string|null;
  joined_at: string; pledge_status: string; contribution_status_this_month: string; last_contribution_at?: string|null;
  months_consistent: number; priority: string; followup_status: string; next_followup_at?: string|null; last_contacted_at?: string|null;
  assigned_admin_id?: string|null; tags: string[]; email_available: boolean; phone_available: boolean;
  email_reminders_opt_in: boolean; whatsapp_reminders_opt_in: boolean;
}
export interface OperationsDonorPage { items: OperationsDonor[]; total: number; page: number; size: number; pages: number; }
export interface DonorDetail { donor: OperationsDonor; email?: string|null; phone?: string|null; internal_notes?: string|null; active_pledge?: Record<string, unknown>|null; recent_contributions: Array<Record<string, unknown>>; open_followups: Array<Record<string, unknown>>; }
export interface FollowupCase { id: string; user_id?: string|null; donor_name?: string|null; type: string; reason: string; priority: string; suggested_message: string; status: string; assigned_admin_id?: string|null; last_contacted_at?: string|null; }
export interface CommunicationPreview { segment: string; total_users: number; app_eligible: number; email_eligible: number; whatsapp_eligible: number; }
export interface OutboundCampaign { id: string; title: string; body: string; segment: string; channels: string[]; content_category?: string|null; status: string; scheduled_for?: string|null; recipient_count: number; sent_count: number; failed_count: number; created_at: string; updated_at: string; }

export async function getCommandCenter(): Promise<CommandCenter> { try { return (await client.get<CommandCenter>('/admin/operations/command-center')).data; } catch (e) { return fail(e); } }
export async function getOperationsDonors(params: Record<string,string|number|undefined>): Promise<OperationsDonorPage> { try { return (await client.get<OperationsDonorPage>('/admin/operations/donors', { params })).data; } catch (e) { return fail(e); } }
export async function getDonorDetail(id: string): Promise<DonorDetail> { try { return (await client.get<DonorDetail>(`/admin/operations/donors/${id}`)).data; } catch (e) { return fail(e); } }
export async function updateDonorProfile(id: string, payload: Record<string, unknown>) { try { return (await client.patch(`/admin/operations/donors/${id}/profile`, payload)).data; } catch (e) { return fail(e); } }
export async function syncFollowups(): Promise<{created:number}> { try { return (await client.post('/admin/operations/followups/sync')).data; } catch (e) { return fail(e); } }
export async function getFollowups(): Promise<FollowupCase[]> { try { return (await client.get<FollowupCase[]>('/admin/operations/followups')).data; } catch (e) { return fail(e); } }
export async function updateFollowup(id: string, payload: Record<string, unknown>) { try { return (await client.patch(`/admin/operations/followups/${id}`, payload)).data; } catch (e) { return fail(e); } }
export async function previewCommunication(segment: DonorSegment, contentCategory='pledge'): Promise<CommunicationPreview> { try { return (await client.get<CommunicationPreview>('/admin/operations/communications/preview', { params: { segment, content_category: contentCategory } })).data; } catch (e) { return fail(e); } }
export async function queueCommunication(payload: { title:string; body:string; segment:DonorSegment; channels:CommunicationChannel[]; content_category?:string; scheduled_for?:string|null; }): Promise<OutboundCampaign> { try { return (await client.post<OutboundCampaign>('/admin/operations/communications', payload)).data; } catch (e) { return fail(e); } }
export async function listCommunications(): Promise<OutboundCampaign[]> { try { return (await client.get<OutboundCampaign[]>('/admin/operations/communications')).data; } catch (e) { return fail(e); } }
export async function runCommunication(id: string): Promise<OutboundCampaign> { try { return (await client.post<OutboundCampaign>(`/admin/operations/communications/${id}/run`)).data; } catch (e) { return fail(e); } }
export function donorExportUrl(segment: DonorSegment): string { return `${BASE_URL}/admin/operations/donors-export.csv?segment=${encodeURIComponent(segment)}`; }
