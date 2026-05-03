import * as SecureStore from 'expo-secure-store';
import { User } from '@/types';
import { Config } from '@/constants/config';

const { SECURE_STORE_KEYS: K } = Config;

export async function persistSession(user: User, isAuthenticated: boolean, refreshToken?: string) {
  const ops: Promise<void>[] = [
    SecureStore.setItemAsync(K.USER,             JSON.stringify(user)),
    SecureStore.setItemAsync(K.IS_AUTHENTICATED, isAuthenticated ? '1' : '0'),
  ];
  if (refreshToken) {
    ops.push(SecureStore.setItemAsync(K.REFRESH_TOKEN, refreshToken));
  }
  await Promise.all(ops);
}

export async function loadSession(): Promise<{ user: User | null; isAuthenticated: boolean; refreshToken: string | null }> {
  const [rawUser, rawAuth, rawRefresh] = await Promise.all([
    SecureStore.getItemAsync(K.USER),
    SecureStore.getItemAsync(K.IS_AUTHENTICATED),
    SecureStore.getItemAsync(K.REFRESH_TOKEN),
  ]);

  let user: User | null = null;
  try {
    if (rawUser) user = JSON.parse(rawUser) as User;
  } catch { /* corrupt data — stay logged out */ }

  return {
    user,
    isAuthenticated: rawAuth === '1' && user !== null,
    refreshToken:    rawRefresh ?? null,
  };
}

export async function clearSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(K.USER),
    SecureStore.deleteItemAsync(K.IS_AUTHENTICATED),
    SecureStore.deleteItemAsync(K.REFRESH_TOKEN),
  ]);
}
