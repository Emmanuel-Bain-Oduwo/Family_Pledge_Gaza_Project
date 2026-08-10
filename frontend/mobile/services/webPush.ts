import { registerNotificationEndpoint } from './notificationEndpointApi';

const env = process.env as Record<string, string | undefined>;

const firebaseConfig = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

const vapidKey = env.EXPO_PUBLIC_FIREBASE_VAPID_KEY || '';

function assertConfigured() {
  const required = [
    firebaseConfig.apiKey,
    firebaseConfig.projectId,
    firebaseConfig.messagingSenderId,
    firebaseConfig.appId,
    vapidKey,
  ];
  if (required.some((value) => !value)) {
    throw new Error('Web notification configuration is incomplete.');
  }
}

async function loadFirebaseModules() {
  // Firebase Messaging is intentionally loaded only by the Web notification
  // path. Android/iOS continue to use expo-notifications exclusively.
  const appModule = await import('firebase/app');
  const messagingModule = await import('firebase/messaging');
  return { appModule, messagingModule };
}

async function initializedMessaging() {
  const { appModule, messagingModule } = await loadFirebaseModules();
  if (!(await messagingModule.isSupported())) return null;
  const firebaseApp = appModule.getApps().length
    ? appModule.getApp()
    : appModule.initializeApp(firebaseConfig);
  return { messagingModule, messaging: messagingModule.getMessaging(firebaseApp) };
}

export async function registerWebPushNotifications(
  requestPermission = true,
): Promise<string | null> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return null;
  assertConfigured();
  const initialized = await initializedMessaging();
  if (!initialized) {
    throw new Error('This browser does not support Web push notifications.');
  }

  let permission = Notification.permission;
  if (permission !== 'granted' && requestPermission) {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return null;

  if (!('serviceWorker' in navigator)) {
    throw new Error('This browser does not support notification service workers.');
  }
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const token = await initialized.messagingModule.getToken(initialized.messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) return null;

  await registerNotificationEndpoint('fcm_web', 'web', token);
  return token;
}

export async function addWebPushLifecycleListeners(
  onOpen: (screen: string) => void,
): Promise<() => void> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return () => {};
  if (!firebaseConfig.apiKey || !firebaseConfig.messagingSenderId) return () => {};

  const initialized = await initializedMessaging();
  if (!initialized) return () => {};

  return initialized.messagingModule.onMessage(initialized.messaging, (payload) => {
    const screen = payload.data?.screen || '/screens/notifications';
    const title = payload.notification?.title || 'Family Pledge';
    const body = payload.notification?.body || '';

    // While the page is focused, FCM gives the message to onMessage instead of
    // displaying a system notification automatically. Show it only if the user
    // has already granted browser notification permission.
    if (Notification.permission === 'granted') {
      const notice = new Notification(title, {
        body,
        data: { screen },
      });
      notice.onclick = () => {
        window.focus();
        notice.close();
        onOpen(screen);
      };
    }
  });
}
