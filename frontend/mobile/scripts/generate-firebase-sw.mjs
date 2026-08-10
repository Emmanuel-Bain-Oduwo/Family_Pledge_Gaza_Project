import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

const configured = Boolean(
  config.apiKey && config.projectId && config.messagingSenderId && config.appId,
);

const body = configured
  ? `/* Generated at build time. Firebase is used only for Web push notifications. */
importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js');
firebase.initializeApp(${JSON.stringify(config)});
firebase.messaging();
`
  : `/* Web push is not configured in this build. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
`;

const publicDir = path.resolve(process.cwd(), 'public');
await mkdir(publicDir, { recursive: true });
await writeFile(path.join(publicDir, 'firebase-messaging-sw.js'), body, 'utf8');
console.log(configured
  ? 'Generated Firebase Web messaging service worker.'
  : 'Generated no-op Web messaging service worker (Firebase env not set).');
