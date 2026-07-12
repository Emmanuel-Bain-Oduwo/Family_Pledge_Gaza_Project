import { Alert, Linking, Platform, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const friendlyAlert = (title: string, message: string) => Alert.alert(title, message);

export const storage = {
  async setItem(key: string, value: string, nativeSet: (key: string, value: string) => Promise<void>) {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
      return;
    }
    await nativeSet(key, value);
  },
  async getItem(key: string, nativeGet: (key: string) => Promise<string | null>) {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    return nativeGet(key);
  },
  async removeItem(key: string, nativeRemove: (key: string) => Promise<void>) {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
      return;
    }
    await nativeRemove(key);
  },
};

export const copyText = async (label: string, value: string): Promise<boolean> => {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    friendlyAlert('Copied', `${label} copied.`);
    return true;
  }

  if (Platform.OS === 'web') {
    friendlyAlert('Copy manually', `${label}: ${value}`);
    return false;
  }

  const { Clipboard } = await import('react-native');
  Clipboard.setString(value);
  friendlyAlert('Copied', `${label} copied.`);
  return true;
};

export const shareText = async (message: string, fallbackLabel = 'Message'): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ text: message });
      return;
    }
    await copyText(fallbackLabel, message);
    friendlyAlert('Sharing not available', 'The message was copied so you can paste it manually.');
    return;
  }

  await Share.share({ message });
};

export const openExternalUrl = async (url: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      friendlyAlert('Cannot open link', 'No app found to open this link.');
    }
  } catch {
    friendlyAlert('Cannot open link', 'Please copy and open this link manually.');
  }
};
