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
  // RN's Appearance override updates native controls/system color scheme. Existing
  // Family Pledge screens still use static brand tokens, so this is intentionally
  // the non-breaking foundation for a later full tokenized dark-theme migration.
  const override: 'light' | 'dark' | null = value === 'system' ? null : value;
  if (typeof Appearance.setColorScheme === 'function') Appearance.setColorScheme(override);
}
