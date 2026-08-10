import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerNotificationEndpoint } from './notificationEndpointApi';
import { NotificationPreferences } from '../types';

const DAILY_KIND = 'family-pledge-daily-reminder';
const FRIDAY_KIND = 'family-pledge-friday-reminder';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
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

async function cancelScheduledNotification(kind: string) {
  if (Platform.OS === 'web') return;
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    existing
      .filter((item) => item.content.data?.kind === kind)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

async function replaceScheduledNotification(
  kind: string,
  content: Notifications.NotificationContentInput,
  trigger: Notifications.NotificationTriggerInput,
) {
  await cancelScheduledNotification(kind);
  await Notifications.scheduleNotificationAsync({
    content: {
      ...content,
      data: { ...content.data, kind, screen: '/screens/notifications' },
    },
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
    {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
      channelId: 'reminders',
    },
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
    {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 6,
      hour: 9,
      minute: 0,
      channelId: 'reminders',
    },
  );
};

export async function applyLocalReminderPreferences(
  preferences: NotificationPreferences,
): Promise<void> {
  if (Platform.OS === 'web') return;
  if (preferences.daily) await scheduleDailyReminder();
  else await cancelScheduledNotification(DAILY_KIND);

  if (preferences.friday) await scheduleFridayReminder();
  else await cancelScheduledNotification(FRIDAY_KIND);
}

export const registerForPushNotifications = async (
  requestPermission = true,
): Promise<string | null> => {
  if (Platform.OS === 'web') {
    const { registerWebPushNotifications } = await import('./webPush');
    return registerWebPushNotifications(requestPermission);
  }

  await ensureAndroidChannels();

  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted' && requestPermission) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (permission.status !== 'granted') return null;

  const projectId =
    (process.env as Record<string, string | undefined>).EXPO_PUBLIC_EAS_PROJECT_ID
    || Constants.expoConfig?.extra?.eas?.projectId
    || Constants.easConfig?.projectId;
  if (!projectId) {
    throw new Error('EAS project ID is not configured for push notifications.');
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await registerNotificationEndpoint(
    'expo',
    Platform.OS === 'android' ? 'android' : 'ios',
    token,
  );
  return token;
};

/** Keep already-authorized endpoints current and route notification taps. */
export function addNotificationLifecycleListeners(onOpen: (screen: string) => void) {
  if (Platform.OS === 'web') {
    let disposed = false;
    let remove: (() => void) | undefined;
    import('./webPush')
      .then(({ addWebPushLifecycleListeners }) => addWebPushLifecycleListeners(onOpen))
      .then((cleanup) => {
        if (disposed) cleanup();
        else remove = cleanup;
      })
      .catch(() => {
        // Web notifications are optional and must not block the app shell.
      });
    return () => {
      disposed = true;
      remove?.();
    };
  }

  const received = Notifications.addNotificationReceivedListener(() => {
    // Foreground presentation is handled by setNotificationHandler above.
  });
  const response = Notifications.addNotificationResponseReceivedListener((event) => {
    const screen = event.notification.request.content.data?.screen;
    onOpen(typeof screen === 'string' ? screen : '/screens/notifications');
  });
  const token = Notifications.addPushTokenListener(() => {
    // Token rotation must never trigger a surprise permission prompt.
    registerForPushNotifications(false).catch(() => {});
  });
  const lastResponse = Notifications.getLastNotificationResponse();
  const screen = lastResponse?.notification.request.content.data?.screen;
  if (lastResponse) onOpen(typeof screen === 'string' ? screen : '/screens/notifications');

  return () => {
    received.remove();
    response.remove();
    token.remove();
  };
}
