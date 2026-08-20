import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppThemePreference = 'dark' | 'light' | 'system';
export type AppLanguage = 'id' | 'en';
export type AppCurrency = 'IDR' | 'USD' | 'EUR' | 'SGD' | 'MYR';

interface SettingsState {
  theme: AppThemePreference;
  language: AppLanguage;
  currency: AppCurrency;
  biometricEnabled: boolean;
  notificationsEnabled: boolean;

  setTheme: (theme: AppThemePreference) => void;
  setLanguage: (lang: AppLanguage) => void;
  setCurrency: (currency: AppCurrency) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      theme: 'dark', // App is designed dark by default
      language: 'id',
      currency: 'IDR',
      biometricEnabled: false,
      notificationsEnabled: false,

      setTheme: theme => set({ theme }),
      setLanguage: language => set({ language }),
      setCurrency: currency => set({ currency }),
      setBiometricEnabled: biometricEnabled => set({ biometricEnabled }),
      setNotificationsEnabled: notificationsEnabled => set({ notificationsEnabled }),
    }),
    {
      name: 'lemburin-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
