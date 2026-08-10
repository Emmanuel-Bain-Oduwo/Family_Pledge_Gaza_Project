'use client';

import { getToken } from './auth';

const DEFAULT_API_URL = 'https://api.familypledgekenya.org/api/v1';
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

export interface ContributionProofLink {
  url: string;
  expires_in: number | null;
  legacy: boolean;
}

export async function getContributionProofLink(id: string): Promise<ContributionProofLink> {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/admin/contributions/${id}/proof-url`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || 'Could not open this contribution proof.');
  }
  return response.json() as Promise<ContributionProofLink>;
}
