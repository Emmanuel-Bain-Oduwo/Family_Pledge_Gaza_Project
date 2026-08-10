import * as SecureStore from 'expo-secure-store';
import { storage } from './webCompat';

const PENDING_CIRCLE_CODE = 'family_pledge_pending_circle_code';

export async function savePendingCircleCode(code: string): Promise<void> {
  await storage.setItem(PENDING_CIRCLE_CODE, code.trim().toUpperCase(), SecureStore.setItemAsync);
}

export async function getPendingCircleCode(): Promise<string | null> {
  return storage.getItem(PENDING_CIRCLE_CODE, SecureStore.getItemAsync);
}

export async function clearPendingCircleCode(): Promise<void> {
  await storage.removeItem(PENDING_CIRCLE_CODE, SecureStore.deleteItemAsync);
}
