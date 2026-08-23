'use client';

import axios from 'axios';
import { getToken, removeToken } from './auth';
import { getApiErrorMessage } from './apiError';

const DEFAULT_API_URL='https://api.familypledgekenya.org/api/v1';
const BASE_URL=(process.env.NEXT_PUBLIC_API_URL||DEFAULT_API_URL).replace(/\/+$/,'');
const client=axios.create({baseURL:BASE_URL,timeout:30000,headers:{'Content-Type':'application/json',Accept:'application/json'}});
client.interceptors.request.use((config)=>{const token=getToken();if(token)config.headers.Authorization=`Bearer ${token}`;return config;});

function fail(error:unknown):never {
  if (axios.isAxiosError(error) && (error.response?.status===401 || error.response?.status===403)) removeToken();
  throw new Error(getApiErrorMessage(error,'Could not complete the payment request.'));
}

export type AdminPaymentStatus='created'|'initiating'|'pending'|'succeeded'|'failed'|'cancelled'|'expired';

export interface AdminPayment {
  id:string;
  user_id:string;
  pledge_id?:string|null;
  campaign_id?:string|null;
  donor_name:string;
  donor_phone?:string|null;
  provider:string;
  payment_method:string;
  purpose:string;
  contribution_month:string;
  status:AdminPaymentStatus;
  requested_amount:number;
  requested_currency:string;
  settlement_amount?:number|null;
  settlement_currency:string;
  fx_rate?:number|null;
  payer_phone:string;
  internal_reference:string;
  merchant_request_id?:string|null;
  checkout_request_id?:string|null;
  mpesa_receipt_number?:string|null;
  provider_result_code?:string|null;
  provider_result_description?:string|null;
  initiated_at?:string|null;
  paid_at?:string|null;
  expires_at?:string|null;
  created_at:string;
  updated_at:string;
}

export interface AdminPaymentPage { items:AdminPayment[];total:number;page:number;size:number;pages:number; }
export interface AdminPaymentSummary { total:number;this_month:number;succeeded:number;pending:number;failed:number;cancelled:number;expired:number;settled_kes:number; }

export async function getPaymentPage(params:{page:number;size:number;status?:string}):Promise<AdminPaymentPage>{
  try{return(await client.get<AdminPaymentPage>('/admin/payments',{params})).data;}catch(error){return fail(error);}
}
export async function getPaymentSummary():Promise<AdminPaymentSummary>{
  try{return(await client.get<AdminPaymentSummary>('/admin/payments/summary')).data;}catch(error){return fail(error);}
}
export async function getPaymentDetail(id:string):Promise<AdminPayment>{
  try{return(await client.get<AdminPayment>(`/admin/payments/${id}`)).data;}catch(error){return fail(error);}
}
