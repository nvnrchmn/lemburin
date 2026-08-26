/**
 * NATIVE storage (iOS / Android APK).
 * Uses expo-secure-store, with a one-time migration from the older
 * AsyncStorage location.
 *
 * NOTE: expo-secure-store exports its functions directly
 * (getItemAsync / setItemAsync / deleteItemAsync) — there is no `SecureStore`
 * wrapper object. Importing a non-existent wrapper silently yields undefined
 * and crashes at call time.
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATE_KEY = 'lemburin-data-store';

export const secureStorage = {
  isWeb: false as const,

  getItem: async (name: string): Promise<string | null> => {
    try {
      const secured = await SecureStore.getItemAsync(STATE_KEY);
      if (secured) return secured;

      // Migrate legacy AsyncStorage value into secure storage once.
      const legacy = await AsyncStorage.getItem(name);
      if (legacy) {
        await SecureStore.setItemAsync(STATE_KEY, legacy);
        await AsyncStorage.removeItem(name);
        return legacy;
      }
      return null;
    } catch (e) {
      console.warn('secureStorage.getItem failed:', e);
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      /* legacy key may not exist */
    }
    try {
      await SecureStore.setItemAsync(STATE_KEY, value);
    } catch (e) {
      console.warn('secureStorage.setItem failed:', e);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      /* legacy key may not exist */
    }
    try {
      await SecureStore.deleteItemAsync(STATE_KEY);
    } catch (e) {
      console.warn('secureStorage.removeItem failed:', e);
    }
  },
};
