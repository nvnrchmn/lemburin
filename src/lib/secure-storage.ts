import { Platform } from 'react-native';

const STATE_KEY = 'lemburin-data-store';

const isWeb = Platform.OS === 'web' || process.env.EXPO_OS === 'web';

const webStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

export const secureStorage = {
  isWeb,

  getItem: async (name: string): Promise<string | null> => {
    if (isWeb) {
      return webStorage.getItem(STATE_KEY) ?? webStorage.getItem(name);
    }
    try {
      const { SecureStore } = require('expo-secure-store');
      const { default: AsyncStorage } = require('@react-native-async-storage/async-storage');
      const secured = await SecureStore.getItemAsync(STATE_KEY);
      if (secured) return secured;
      const legacy = await AsyncStorage.getItem(name);
      if (legacy) {
        await SecureStore.setItemAsync(STATE_KEY, legacy);
        await AsyncStorage.removeItem(name);
        return legacy;
      }
      return null;
    } catch {
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    if (isWeb) {
      webStorage.removeItem(name);
      webStorage.setItem(STATE_KEY, value);
      return;
    }
    try {
      const { default: AsyncStorage } = require('@react-native-async-storage/async-storage');
      await AsyncStorage.removeItem(name);
    } catch {
      /* ignore */
    }
    const { SecureStore } = require('expo-secure-store');
    await SecureStore.setItemAsync(STATE_KEY, value);
  },

  removeItem: async (name: string): Promise<void> => {
    if (isWeb) {
      webStorage.removeItem(name);
      webStorage.removeItem(STATE_KEY);
      return;
    }
    try {
      const { default: AsyncStorage } = require('@react-native-async-storage/async-storage');
      await AsyncStorage.removeItem(name);
    } catch {
      /* ignore */
    }
    const { SecureStore } = require('expo-secure-store');
    await SecureStore.deleteItemAsync(STATE_KEY);
  },
};
