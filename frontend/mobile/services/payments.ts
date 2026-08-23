import client from './api';
import { getApiErrorMessage } from './apiError';

export type PaymentStatus = 'created' | 'initiating' | 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'expired';

export interface PaymentRecord {
  id: string;
  user_id: string;
  pledge_id?: string | null;
  campaign_id?: string | null;
  provider: string;
  payment_method: string;
  purpose: string;
  contribution_month: string;
  status: PaymentStatus;
  requested_amount: number;
  requested_currency: string;
  settlement_amount?: number | null;
  settlement_currency: string;
  fx_rate?: number | null;
  payer_phone: string;
  internal_reference: string;
  merchant_request_id?: string | null;
  checkout_request_id?: string | null;
  mpesa_receipt_number?: string | null;
  provider_result_code?: string | null;
  provider_result_description?: string | null;
  initiated_at?: string | null;
  paid_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MpesaInitiateResult {
  payment: PaymentRecord;
  customer_message: string;
}

const fail = (error: unknown): never => {
  throw new Error(getApiErrorMessage(error, 'Could not complete the M-PESA request.'));
};

export async function initiateMpesaPayment(payload: {
  pledge_id: string;
  phone: string;
  contribution_month: string;
  idempotency_key: string;
  campaign_id?: string;
}): Promise<MpesaInitiateResult> {
  try {
    return (await client.post<MpesaInitiateResult>('/payments/mpesa/initiate', payload)).data;
  } catch (error) {
    return fail(error);
  }
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentRecord> {
  try {
    return (await client.get<PaymentRecord>(`/payments/${paymentId}`)).data;
  } catch (error) {
    return fail(error);
  }
}

export async function getMyPayments(): Promise<PaymentRecord[]> {
  try {
    return (await client.get<PaymentRecord[]>('/payments/me')).data;
  } catch (error) {
    return fail(error);
  }
}
