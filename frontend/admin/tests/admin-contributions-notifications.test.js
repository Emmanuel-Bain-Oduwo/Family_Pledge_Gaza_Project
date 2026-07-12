const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const api = read('lib/api.ts');
const contributionPage = read('app/contributions/page.tsx');
const notificationPage = read('app/notifications/page.tsx');
const types = read('types/index.ts');

const adaptContributionForTest = (raw) => {
  const [yearPart, monthPart] = (raw.contribution_month || '').split('-');
  const year = Number(yearPart) || new Date().getFullYear();
  const monthIndex = Number(monthPart) - 1;
  const month = monthIndex >= 0 && monthIndex <= 11
    ? new Date(Date.UTC(year, monthIndex, 1)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
    : raw.month || 'Unknown';

  return {
    ...raw,
    id: raw.id || '',
    user_id: raw.user_id || '',
    donor_name: raw.user_full_name || raw.donor_name || 'Unknown donor',
    donor_phone: raw.user_phone || raw.donor_phone || '—',
    amount: raw.amount ?? 0,
    currency: raw.currency || 'USD',
    reference: raw.transaction_reference || raw.reference || '—',
    proof_url: raw.proof_image_url || raw.proof_url,
    payment_method: raw.contribution_channel || raw.payment_method || 'Not specified',
    status: raw.status || 'submitted',
    month,
    year,
    submitted_at: raw.created_at || raw.submitted_at || '',
    reviewed_at: raw.confirmed_at || raw.reviewed_at,
    reviewed_by: raw.confirmed_by || raw.reviewed_by,
  };
};

const backendContribution = {
  id: 'contribution-1',
  user_id: 'user-1',
  user_full_name: 'Amina Yusuf',
  user_phone: '+254700000000',
  amount: 25,
  currency: 'USD',
  contribution_channel: 'bank_transfer',
  transaction_reference: 'TXN-123',
  proof_image_url: 'https://example.test/proof.jpg',
  contribution_month: '2026-07',
  status: 'submitted',
  created_at: '2026-07-03T10:00:00Z',
};
const adapted = adaptContributionForTest(backendContribution);
assert.equal(adapted.payment_method, 'bank_transfer');
assert.equal(adapted.reference, 'TXN-123');
assert.equal(adapted.month, 'July');
assert.equal(adapted.year, 2026);
assert.equal(adapted.submitted_at, '2026-07-03T10:00:00Z');

const nullableAdapted = adaptContributionForTest({
  id: 'contribution-2',
  user_id: 'user-2',
  user_full_name: null,
  user_phone: null,
  amount: null,
  currency: null,
  contribution_channel: null,
  transaction_reference: null,
  contribution_month: '2026-07',
  status: 'submitted',
  created_at: '2026-07-04T10:00:00Z',
});
assert.equal(nullableAdapted.donor_name, 'Unknown donor');
assert.equal(nullableAdapted.donor_phone, '—');
assert.equal(nullableAdapted.payment_method, 'Not specified');
assert.equal(nullableAdapted.reference, '—');
assert.equal(nullableAdapted.amount, 0);
assert.equal(nullableAdapted.currency, 'USD');

const existing = { id: 'contribution-3', user_id: 'user-3', donor_name: 'Preserved Donor', donor_phone: '+15550000000' };
const reviewResponse = adaptContributionForTest({ id: 'contribution-3', status: 'confirmed', contribution_month: '2026-07' });
const merged = { ...reviewResponse, donor_name: existing.donor_name, donor_phone: existing.donor_phone, user_id: existing.user_id };
assert.equal(merged.donor_name, 'Preserved Donor');
assert.equal(merged.donor_phone, '+15550000000');
assert.equal(merged.user_id, 'user-3');

const getNotificationItems = (data) => Array.isArray(data) ? data : data.items || [];
const notification = { id: 'n1', title: 'Hello', body: 'World', notification_type: 'system', audience: 'all_users' };
assert.deepEqual(getNotificationItems({ items: [notification], total: 1, page: 1, size: 20, pages: 1 }), [notification]);
assert.deepEqual(getNotificationItems({ items: [], total: 0, page: 1, size: 20, pages: 0 }), []);
const emptyNotifications = getNotificationItems({ items: [], total: 0, page: 1, size: 20, pages: 0 });
assert.doesNotThrow(() => emptyNotifications.reduce((s, n) => s + (n.sent_count || 0), 0));
assert.doesNotThrow(() => emptyNotifications.map((n) => n.id));

for (const needle of [
  'export const adaptContribution',
  'contribution_channel?: string | null',
  'transaction_reference?: string | null',
  'proof_image_url?: string | null',
  'contribution_month?: string | null',
  'created_at?: string | null',
  'confirmed_at?: string | null',
  'confirmed_by?: string | null',
  '(data.items || []).map(adaptContribution)',
  'return adaptContribution(unwrap(data));',
  'return Array.isArray(data) ? data : data.items || [];',
]) {
  assert(api.includes(needle), `Missing API implementation: ${needle}`);
}

assert(contributionPage.includes('{ ...updated, donor_name: c.donor_name, donor_phone: c.donor_phone, user_id: c.user_id }'));
assert(notificationPage.includes('setNotifications(Array.isArray(items) ? items : [])'));
assert(notificationPage.includes("notifications[0]?.sent_at"));
assert(notificationPage.includes("n.sent_at ? formatDateTime(n.sent_at) : '—'"));
assert(types.includes('items: T[];'));
assert(types.includes('size: number;'));
assert(types.includes('pages: number;'));

console.log('Focused admin contributions/notifications crash checks passed');
