'use client';

import axios from 'axios';
import { getToken, removeToken } from './auth';
import type { Reminder } from '../types';

const DEFAULT_API_URL='https://api.familypledgekenya.org/api/v1';
const BASE_URL=(process.env.NEXT_PUBLIC_API_URL||DEFAULT_API_URL).replace(/\/+$/,'');
const client=axios.create({baseURL:BASE_URL,timeout:30000,headers:{'Content-Type':'application/json',Accept:'application/json'}});
client.interceptors.request.use((config)=>{const token=getToken();if(token)config.headers.Authorization=`Bearer ${token}`;return config;});
function fail(e:unknown):never{if(axios.isAxiosError(e)){if(e.response?.status===401||e.response?.status===403)removeToken();const data=e.response?.data as {detail?:string;message?:string}|undefined;throw new Error(data?.detail||data?.message||e.message);}throw e;}

export type AdminReminder = Reminder & { reminder_type?: string; scheduled_for?: string|null; updated_at?: string; };
export type ReminderWrite = Partial<Reminder> & { scheduled_for?: string|null; };
export async function getAdminReminders(params?:{type?:string;status?:string;page?:number;size?:number}):Promise<{items:AdminReminder[];total:number;pages:number}>{try{const query={reminder_type:params?.type||undefined,status:params?.status||undefined,page:params?.page||1,size:params?.size||100};const {data}=await client.get<{items:AdminReminder[];total:number;pages:number}>('/admin/daily-reminders',{params:query});return data;}catch(e){return fail(e);}}
export async function createAdminReminder(payload:ReminderWrite):Promise<AdminReminder>{try{return(await client.post<AdminReminder>('/admin/daily-reminders',payload)).data;}catch(e){return fail(e);}}
export async function updateAdminReminder(id:string,payload:ReminderWrite):Promise<AdminReminder>{try{return(await client.patch<AdminReminder>(`/admin/daily-reminders/${id}`,payload)).data;}catch(e){return fail(e);}}
export async function approveAdminReminder(id:string):Promise<AdminReminder>{try{return(await client.patch<AdminReminder>(`/admin/daily-reminders/${id}/approve`)).data;}catch(e){return fail(e);}}
export async function publishAdminReminder(id:string):Promise<AdminReminder>{try{return(await client.patch<AdminReminder>(`/admin/daily-reminders/${id}/publish`)).data;}catch(e){return fail(e);}}
