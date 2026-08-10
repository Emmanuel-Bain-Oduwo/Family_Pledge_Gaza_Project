import api, { getMe } from './api';
import { NotificationPreferences, User } from '../types';

export function preferencesFromUser(user: User): NotificationPreferences {
  return {
    daily: Boolean(user.notification_daily),
    friday: Boolean(user.notification_friday),
    campaigns: Boolean(user.notification_campaigns),
    emergency: Boolean(user.notification_emergency),
    onboarding_seen: Boolean(user.notification_onboarding_seen),
  };
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return preferencesFromUser(await getMe());
}

export async function updateNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<User> {
  const { data } = await api.patch<User>('/users/me/notification-preferences', preferences);
  return data;
}
