/**
 * NATIVE auth storage adapter for Supabase (iOS / Android APK).
 * AsyncStorage is imported statically so it is ready synchronously — using a
 * dynamic import here can make Supabase read the session before the module is
 * loaded, which silently loses the logged-in session on cold start.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};
