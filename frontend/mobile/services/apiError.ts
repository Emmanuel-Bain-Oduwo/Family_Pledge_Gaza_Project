import axios from 'axios';

function formatValidationItem(item: unknown): string {
  if (typeof item === 'string') return item;
  if (!item || typeof item !== 'object') return String(item ?? '');
  const value = item as Record<string, unknown>;
  const message = typeof value.msg === 'string'
    ? value.msg
    : typeof value.message === 'string'
      ? value.message
      : typeof value.detail === 'string'
        ? value.detail
        : '';
  const loc = Array.isArray(value.loc)
    ? value.loc.filter((part) => part !== 'body' && part !== 'query').map(String)
    : [];
  if (message) return loc.length ? `${loc.join(' → ')}: ${message}` : message;
  return Object.entries(value)
    .filter(([, nested]) => nested !== null && nested !== undefined)
    .map(([key, nested]) => `${key}: ${formatApiPayload(nested)}`)
    .join(' · ');
}

export function formatApiPayload(payload: unknown): string {
  if (payload === null || payload === undefined) return '';
  if (typeof payload === 'string') return payload;
  if (typeof payload === 'number' || typeof payload === 'boolean') return String(payload);
  if (Array.isArray(payload)) return payload.map(formatValidationItem).filter(Boolean).join(' · ');
  if (typeof payload === 'object') {
    const value = payload as Record<string, unknown>;
    for (const key of ['detail', 'message', 'error', 'msg']) {
      if (key in value && value[key] !== payload) {
        const formatted = formatApiPayload(value[key]);
        if (formatted) return formatted;
      }
    }
    return formatValidationItem(value);
  }
  return String(payload);
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const formatted = formatApiPayload(error.response?.data);
    return formatted || error.message || fallback;
  }
  if (error instanceof Error) return error.message || fallback;
  const formatted = formatApiPayload(error);
  return formatted || fallback;
}
