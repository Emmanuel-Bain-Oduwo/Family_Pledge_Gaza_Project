import * as SecureStore from 'expo-secure-store';
import { AuthTokens, User } from '../types';

const TOKEN_KEY = 'family_pledge_token';
const USER_KEY = 'family_pledge_user';

export const saveToken = async (tokens: AuthTokens): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_KEY, tokens.access_token);
};

export const getToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const saveUser = async (user: User): Promise<void> => {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
};

export const getUser = async (): Promise<User | null> => {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

export const removeUser = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(USER_KEY);
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  return !!token;
};

export const logout = async (): Promise<void> => {
  await removeToken();
  await removeUser();
};
