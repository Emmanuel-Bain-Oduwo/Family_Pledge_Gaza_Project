import axios from 'axios';
import { Config } from '../constants/config';
import type { AuthTokens, RegisterPayload, User } from '../types';
import { getToken } from './auth';

export interface CommunicationPreferences {
  email_reminders_opt_in: boolean;
  whatsapp_reminders_opt_in: boolean;
}

export interface RegisterWithPreferencesPayload extends RegisterPayload, CommunicationPreferences {}
export type UserWithCommunicationPreferences = User & CommunicationPreferences;

const client=axios.create({baseURL:Config.API_URL,timeout:15000,headers:{'Content-Type':'application/json',Accept:'application/json'}});
client.interceptors.request.use(async(config)=>{const token=await getToken();if(token)config.headers.Authorization=`Bearer ${token}`;return config;});
function fail(error:unknown):never{if(axios.isAxiosError(error)){const data=error.response?.data as {detail?:string;message?:string}|undefined;throw new Error(data?.detail||data?.message||error.message);}throw error;}
function optional(value?:string){const cleaned=value?.trim();return cleaned||undefined;}

export async function registerWithPreferences(payload:RegisterWithPreferencesPayload):Promise<AuthTokens>{
  try{return(await client.post<AuthTokens>('/auth/register',{
    full_name:payload.full_name.trim(),nickname:optional(payload.nickname),phone:payload.phone.trim(),email:optional(payload.email),
    country:payload.country.trim(),city:optional(payload.city),password:payload.password,referral_code:optional(payload.referral_code),
    email_reminders_opt_in:payload.email_reminders_opt_in,whatsapp_reminders_opt_in:payload.whatsapp_reminders_opt_in,
  })).data;}catch(e){return fail(e);}
}

export async function getCommunicationUser():Promise<UserWithCommunicationPreferences>{try{return(await client.get<UserWithCommunicationPreferences>('/users/me')).data;}catch(e){return fail(e);}}
export async function updateCommunicationPreferences(preferences:CommunicationPreferences):Promise<UserWithCommunicationPreferences>{try{return(await client.patch<UserWithCommunicationPreferences>('/users/me/communication-preferences',preferences)).data;}catch(e){return fail(e);}}
