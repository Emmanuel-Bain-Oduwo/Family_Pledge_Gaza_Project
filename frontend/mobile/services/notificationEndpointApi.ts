import client from './api';

export type NotificationProvider = 'expo' | 'fcm_web';
export type NotificationPlatform = 'android' | 'ios' | 'web' | 'native';

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
}

export async function deactivateNotificationEndpoint(
  provider: NotificationProvider,
  token: string,
): Promise<void> {
  await client.post('/auth/notification-endpoints/deactivate', { provider, token });
}
