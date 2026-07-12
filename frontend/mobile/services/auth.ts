import * as SecureStore from 'expo-secure-store';
import { storage } from './webCompat';
import { AuthTokens, User } from '../types';

const TOKEN_KEY = 'family_pledge_token';
const USER_KEY = 'family_pledge_user';

export const saveToken = async (tokens: AuthTokens): Promise<void> => {
  await storage.setItem(TOKEN_KEY, tokens.access_token, SecureStore.setItemAsync);
};

export const getToken = async (): Promise<string | null> => {
  return storage.getItem(TOKEN_KEY, SecureStore.getItemAsync);
};

export const removeToken = async (): Promise<void> => {
  await storage.removeItem(TOKEN_KEY, SecureStore.deleteItemAsync);
};

export const saveUser = async (user: User): Promise<void> => {
  await storage.setItem(USER_KEY, JSON.stringify(user), SecureStore.setItemAsync);
};

export const getUser = async (): Promise<User | null> => {
  const raw = await storage.getItem(USER_KEY, SecureStore.getItemAsync);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

export const removeUser = async (): Promise<void> => {
  await storage.removeItem(USER_KEY, SecureStore.deleteItemAsync);
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  return !!token;
};

export const logout = async (): Promise<void> => {
  await removeToken();
  await removeUser();
};
