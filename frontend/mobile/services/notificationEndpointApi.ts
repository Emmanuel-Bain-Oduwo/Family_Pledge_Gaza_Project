import AsyncStorage from '@react-native-async-storage/async-storage';
import client from './api';

export type NotificationProvider = 'expo' | 'fcm_web';
export type NotificationPlatform = 'android' | 'ios' | 'web' | 'native';

type RememberedEndpoint = {
  provider: NotificationProvider;
  platform: NotificationPlatform;
  token: string;
};

const ENDPOINT_STORAGE_KEY = 'family_pledge_notification_endpoints';

async function readRememberedEndpoints(): Promise<RememberedEndpoint[]> {
  try {
    const raw = await AsyncStorage.getItem(ENDPOINT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function rememberEndpoint(endpoint: RememberedEndpoint): Promise<void> {
  const current = await readRememberedEndpoints();
  const withoutDuplicate = current.filter(
    (item) => !(item.provider === endpoint.provider && item.token === endpoint.token),
  );
  await AsyncStorage.setItem(
    ENDPOINT_STORAGE_KEY,
    JSON.stringify([...withoutDuplicate, endpoint]),
  );
}

async function forgetEndpoint(provider: NotificationProvider, token: string): Promise<void> {
  const current = await readRememberedEndpoints();
  const next = current.filter((item) => !(item.provider === provider && item.token === token));
  if (next.length) await AsyncStorage.setItem(ENDPOINT_STORAGE_KEY, JSON.stringify(next));
  else await AsyncStorage.removeItem(ENDPOINT_STORAGE_KEY);
}

export async function registerNotificationEndpoint(
  provider: NotificationProvider,
  platform: NotificationPlatform,
  token: string,
  deviceId?: string,
): Promise<void> {
  await client.post('/auth/notification-endpoints', {
    provider,
    platform,
    token,
    device_id: deviceId,
  });
  await rememberEndpoint({ provider, platform, token });
}

export async function deactivateNotificationEndpoint(
  provider: NotificationProvider,
  token: string,
): Promise<void> {
  await client.post('/auth/notification-endpoints/deactivate', { provider, token });
  await forgetEndpoint(provider, token);
}

/**
 * Best-effort remote cleanup while the current auth token still exists.
 * The current backend logout endpoint deactivates every endpoint belonging to
 * the account, including tokens registered by an older app build. If that call
 * fails, fall back to the endpoints remembered by this device/browser.
 */
export async function deactivateRememberedNotificationEndpoints(): Promise<void> {
  const endpoints = await readRememberedEndpoints();
  let serverLogoutCompleted = false;
  try {
    await client.post('/auth/logout');
    serverLogoutCompleted = true;
  } catch {
    // Fall through to per-endpoint cleanup below.
  }

  if (!serverLogoutCompleted) {
    for (const endpoint of endpoints) {
      try {
        await client.post('/auth/notification-endpoints/deactivate', {
          provider: endpoint.provider,
          token: endpoint.token,
        });
      } catch {
        // Sign-out must still complete if the API is temporarily unreachable.
      }
    }
  }

  await AsyncStorage.removeItem(ENDPOINT_STORAGE_KEY);
}
