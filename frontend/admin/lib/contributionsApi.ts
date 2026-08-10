'use client';

import axios from 'axios';
import { getToken, removeToken } from './auth';
import { adaptContribution } from './api';
import type { Contribution } from '../types';

const DEFAULT_API_URL='https://api.familypledgekenya.org/api/v1';
const BASE_URL=(process.env.NEXT_PUBLIC_API_URL||DEFAULT_API_URL).replace(/\/+$/,'');
const client=axios.create({baseURL:BASE_URL,timeout:30000,headers:{'Content-Type':'application/json',Accept:'application/json'}});
client.interceptors.request.use((config)=>{const token=getToken();if(token)config.headers.Authorization=`Bearer ${token}`;return config;});
function fail(e:unknown):never{if(axios.isAxiosError(e)){if(e.response?.status===401||e.response?.status===403)removeToken();const data=e.response?.data as {detail?:string;message?:string}|undefined;throw new Error(data?.detail||data?.message||e.message);}throw e;}

type BackendContribution=Parameters<typeof adaptContribution>[0];
export interface ContributionPage{items:Contribution[];total:number;page:number;size:number;pages:number;}
export interface ContributionSummary{total:number;this_month:number;submitted:number;confirmed:number;rejected:number;needs_follow_up:number;}

export async function getContributionPage(params:{page:number;size:number;status?:string}):Promise<ContributionPage>{try{const {data}=await client.get<{items:BackendContribution[];total:number;page:number;size:number;pages:number}>('/admin/contributions',{params});return{...data,items:(data.items||[]).map(adaptContribution)};}catch(e){return fail(e);}}
export async function getContributionSummary():Promise<ContributionSummary>{try{return(await client.get<ContributionSummary>('/admin/contributions-summary')).data;}catch(e){return fail(e);}}
