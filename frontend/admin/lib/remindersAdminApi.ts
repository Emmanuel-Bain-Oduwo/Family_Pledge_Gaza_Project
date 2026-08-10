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
export async function getAdminReminders(params?:{type?:string;status?:string;page?:number;size?:number}):Promise<{items:AdminReminder[];total:number;pages:number}>{try{const query={reminder_type:params?.type||undefined,status:params?.status||undefined,page:params?.page||1,size:params?.size||100};const {data}=await client.get<{items:AdminReminder[];total:number;pages:number}>('/admin/daily-reminders',{params:query});return data;}catch(e){return fail(e);}}
