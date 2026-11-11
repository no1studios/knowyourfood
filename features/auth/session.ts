/**
 * Persist signed-in AuthSession locally (SecureStore when available, AsyncStorage fallback).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { AuthSession } from './types';

const STORAGE_KEY = 'kyf.auth.session.v1';

async function secureAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const SecureStore = await import('expo-secure-store');
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function readRaw(): Promise<string | null> {
  if (await secureAvailable()) {
    const SecureStore = await import('expo-secure-store');
    return SecureStore.getItemAsync(STORAGE_KEY);
  }
  return AsyncStorage.getItem(STORAGE_KEY);
}

async function writeRaw(value: string | null): Promise<void> {
  if (await secureAvailable()) {
    const SecureStore = await import('expo-secure-store');
    if (value == null) {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      return;
    }
    await SecureStore.setItemAsync(STORAGE_KEY, value);
    return;
  }
  if (value == null) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, value);
}

export const authSessionStore = {
  async load(): Promise<AuthSession | null> {
    try {
      const raw = await readRaw();
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AuthSession;
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.isGuest) return parsed;
      if (!parsed.provider || !parsed.issuedAt) return null;
      return parsed;
    } catch {
      return null;
    }
  },

  async save(session: AuthSession): Promise<void> {
    await writeRaw(JSON.stringify(session));
  },

  async clear(): Promise<void> {
    await writeRaw(null);
  },
};

export { STORAGE_KEY as AUTH_SESSION_STORAGE_KEY };
