import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { savePushToken } from './api';

const DAILY_KIND = 'family-pledge-daily-reminder';
const FRIDAY_KIND = 'family-pledge-friday-reminder';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;
  await Promise.all([
    Notifications.setNotificationChannelAsync('default', {
      name: 'Family Pledge updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0B6B3A',
      sound: 'default',
    }),
    Notifications.setNotificationChannelAsync('emergency', {
      name: 'Emergency alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#D94A38',
      sound: 'default',
    }),
    Notifications.setNotificationChannelAsync('reminders', {
      name: 'Pledge reminders',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#D6A437',
      sound: 'default',
    }),
  ]);
}

async function replaceScheduledNotification(kind: string, content: Notifications.NotificationContentInput, trigger: Notifications.NotificationTriggerInput) {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    existing
      .filter((item) => item.content.data?.kind === kind)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
  await Notifications.scheduleNotificationAsync({
    content: { ...content, data: { ...content.data, kind, screen: '/screens/notifications' } },
    trigger,
  });
}

export const scheduleDailyReminder = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  await replaceScheduledNotification(
    DAILY_KIND,
    {
      title: 'Your Daily Family Pledge Reminder',
      body: 'Remember Gaza in your prayers, pledge, and daily actions.',
      sound: 'default',
    },
    { hour: 8, minute: 0, repeats: true, channelId: 'reminders' },
  );
};

export const scheduleFridayReminder = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  await replaceScheduledNotification(
    FRIDAY_KIND,
    {
      title: 'Friday Challenge 🕌',
      body: 'It is Jumu’ah—open Family Pledge to see today’s campaign and share it.',
      sound: 'default',
    },
    { weekday: 6, hour: 9, minute: 0, repeats: true, channelId: 'reminders' },
  );
};

export const registerForPushNotifications = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return null;
  await ensureAndroidChannels();

  const current = await Notifications.getPermissionsAsync();
  const permission = current.status === 'granted'
    ? current
    : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return null;

  const projectId = (process.env as Record<string, string | undefined>).EXPO_PUBLIC_EAS_PROJECT_ID
    || Constants.easConfig?.projectId;
  if (!projectId) throw new Error('EAS project ID is not configured for push notifications.');

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await savePushToken(token);
  await Promise.all([scheduleDailyReminder(), scheduleFridayReminder()]);
  return token;
};

/** Keep the backend token current and route notification taps into the in-app feed. */
export function addNotificationLifecycleListeners(onOpen: (screen: string) => void) {
  if (Platform.OS === 'web') return () => {};
  const received = Notifications.addNotificationReceivedListener(() => {
    // The foreground popup is presented by setNotificationHandler above.
  });
  const response = Notifications.addNotificationResponseReceivedListener((event) => {
    const screen = event.notification.request.content.data?.screen;
    onOpen(typeof screen === 'string' ? screen : '/screens/notifications');
  });
  const token = Notifications.addPushTokenListener(() => {
    // Native APNs/FCM tokens can rotate. Resolve a fresh Expo token before
    // updating our backend, which intentionally stores Expo-format tokens only.
    registerForPushNotifications().catch(() => {});
  });
  Notifications.getLastNotificationResponseAsync()
    .then((event) => {
      const screen = event?.notification.request.content.data?.screen;
      if (event) onOpen(typeof screen === 'string' ? screen : '/screens/notifications');
    })
    .catch(() => {});
  return () => {
    received.remove();
    response.remove();
    token.remove();
  };
}
