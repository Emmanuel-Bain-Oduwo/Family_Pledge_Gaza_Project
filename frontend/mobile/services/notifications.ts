import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { savePushToken } from './api';

const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || 'family-pledge-namlef';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const registerForPushNotifications = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return null;
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  const token = tokenData.data;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Family Pledge',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0B6B3A',
    });
    await Notifications.setNotificationChannelAsync('emergency', {
      name: 'Emergency Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#D94A38',
    });
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Daily Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#D6A437',
    });
  }

  await savePushToken(token);
  return token;
};

export const scheduleDailyReminder = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your Daily Reminder',
      body: 'Bismillah — remember your pledge for Gaza today.',
      sound: true,
    },
    trigger: {
      hour: 8,
      minute: 0,
      repeats: true,
    },
  });
};

export const scheduleFridayReminder = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Friday Challenge 🕌',
      body: 'Help us reach 200 donors today. Share & contribute!',
      sound: true,
    },
    trigger: {
      weekday: 6,
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });
};
