import api, { getMe } from './api';
import { NotificationPreferences, User } from '../types';

export function preferencesFromUser(user: User): NotificationPreferences {
  return {
    daily: Boolean(user.notification_daily),
    friday: Boolean(user.notification_friday),
    campaigns: Boolean(user.notification_campaigns),
    emergency: Boolean(user.notification_emergency),
    quran: Boolean(user.notification_quran),
    hadith: Boolean(user.notification_hadith),
    dua: Boolean(user.notification_dua),
    dhikr: Boolean(user.notification_dhikr),
    shirk: Boolean(user.notification_shirk),
    sadaqah: Boolean(user.notification_sadaqah),
    motivation: Boolean(user.notification_motivation),
    impact: Boolean(user.notification_impact),
    humanitarian: Boolean(user.notification_humanitarian),
    onboarding_seen: Boolean(user.notification_onboarding_seen),
  };
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return preferencesFromUser(await getMe());
}

export async function updateNotificationPreferences(preferences: NotificationPreferences): Promise<User> {
  const { data } = await api.patch<User>('/users/me/notification-preferences', preferences);
  return data;
}
