import axios from 'axios';
import { getToken, removeToken } from './auth';
import type { AiDraft } from '../types';

const DEFAULT_API_URL = 'https://api.familypledgekenya.org/api/v1';
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

const aiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 40000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

aiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function fail(error: unknown): never {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401 || error.response?.status === 403) removeToken();
    const data = error.response?.data as { detail?: string; message?: string } | undefined;
    throw new Error(data?.detail || data?.message || error.message);
  }
  throw error;
}

export async function updateAiDraftText(id: string, generatedText: string): Promise<AiDraft> {
  try {
    return (await aiClient.patch<AiDraft>(`/admin/ai/drafts/${id}`, {
      generated_text: generatedText,
    })).data;
  } catch (error) {
    return fail(error);
  }
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiContextBlock {
  name: string;
  description: string;
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

export interface AiChatResponse {
  answer: string;
  context_used: AiContextBlock[];
  scope: string;
  actions_executed: string[];
}

export async function askFamilyPledgeAi(
  message: string,
  history: AiChatMessage[],
): Promise<AiChatResponse> {
  try {
    return (await aiClient.post<AiChatResponse>('/admin/ai/chat', {
      message,
      history: history.slice(-12),
    })).data;
  } catch (error) {
    return fail(error);
  }
}

export interface AiTask {
  id: string;
  created_by_admin_id: string;
  title: string;
  task_type: string;
  instruction: string;
  schedule_type?: string | null;
  cron_expression?: string | null;
  timezone: string;
  requires_approval: boolean;
  status: 'draft' | 'active' | 'paused' | 'cancelled';
  last_run_at?: string | null;
  next_run_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiTaskRun {
  id: string;
  task_id: string;
  status: string;
  planned_action?: Record<string, unknown> | null;
  generated_output?: {
    text?: string;
    context_used?: string[];
    actions_executed?: string[];
    [key: string]: unknown;
  } | null;
  validation_result?: Record<string, unknown> | null;
  error_message?: string | null;
  executed_at?: string | null;
  created_at: string;
}

export async function listAiTasks(): Promise<AiTask[]> {
  try {
    return (await aiClient.get<AiTask[]>('/admin/ai/tasks')).data;
  } catch (error) {
    return fail(error);
  }
}

export async function createAiTask(payload: {
  title: string;
  instruction: string;
  task_type?: string;
  schedule_type?: 'daily' | 'weekly' | null;
  timezone?: string;
  requires_approval?: boolean;
  status?: string;
}): Promise<AiTask> {
  try {
    return (await aiClient.post<AiTask>('/admin/ai/tasks', {
      task_type: 'custom_admin_task',
      timezone: 'UTC',
      requires_approval: true,
      status: 'active',
      ...payload,
    })).data;
  } catch (error) {
    return fail(error);
  }
}

export async function updateAiTask(id: string, changes: Partial<AiTask>): Promise<AiTask> {
  try {
    return (await aiClient.patch<AiTask>(`/admin/ai/tasks/${id}`, changes)).data;
  } catch (error) {
    return fail(error);
  }
}

export async function runAiTaskNow(id: string): Promise<AiTaskRun> {
  try {
    return (await aiClient.post<AiTaskRun>(`/admin/ai/tasks/${id}/run-now`)).data;
  } catch (error) {
    return fail(error);
  }
}

export async function listAiTaskRuns(taskId?: string): Promise<AiTaskRun[]> {
  try {
    return (await aiClient.get<AiTaskRun[]>('/admin/ai/task-runs', {
      params: taskId ? { task_id: taskId } : undefined,
    })).data;
  } catch (error) {
    return fail(error);
  }
}

export async function retryAiTaskRun(runId: string): Promise<AiTaskRun> {
  try {
    return (await aiClient.post<AiTaskRun>(`/admin/ai/task-runs/${runId}/retry`)).data;
  } catch (error) {
    return fail(error);
  }
}

export async function approveAiTaskRun(runId: string): Promise<AiTaskRun> {
  try {
    return (await aiClient.post<AiTaskRun>(`/admin/ai/task-runs/${runId}/approve`)).data;
  } catch (error) {
    return fail(error);
  }
}

export async function dismissAiTaskRun(runId: string): Promise<AiTaskRun> {
  try {
    return (await aiClient.post<AiTaskRun>(`/admin/ai/task-runs/${runId}/dismiss`)).data;
  } catch (error) {
    return fail(error);
  }
}
