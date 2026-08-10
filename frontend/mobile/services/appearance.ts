import { Appearance } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { storage } from './webCompat';

export type AppearancePreference = 'system' | 'light' | 'dark';
const KEY = 'family_pledge_appearance';

export async function getAppearancePreference(): Promise<AppearancePreference> {
  const value = await storage.getItem(KEY, SecureStore.getItemAsync);
  return value === 'light' || value === 'dark' ? value : 'system';
}

export async function setAppearancePreference(value: AppearancePreference): Promise<void> {
  await storage.setItem(KEY, value, SecureStore.setItemAsync);
  applyAppearancePreference(value);
}

export function applyAppearancePreference(value: AppearancePreference): void {
  // Keep "system" OS-managed in this SDK rather than forcing an unsupported
  // null override. Light/dark can be explicitly requested without changing the
  // existing Family Pledge screen styles.
  if (value !== 'system' && typeof Appearance.setColorScheme === 'function') {
    Appearance.setColorScheme(value);
  }
}
