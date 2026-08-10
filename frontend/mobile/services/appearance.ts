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
  // React Native accepts a null reset at runtime so System can return control to
  // the operating system. The SDK 55 type declaration is narrower than that
  // runtime API, hence the localized cast rather than weakening app-wide types.
  if (typeof Appearance.setColorScheme === 'function') {
    Appearance.setColorScheme((value === 'system' ? null : value) as any);
  }
}
