import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  theme: 'dark' | 'light' | 'system';
  language: 'id' | 'en';
  currency: 'IDR' | 'USD';
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setLanguage: (lang: 'id' | 'en') => void;
  setCurrency: (currency: 'IDR' | 'USD') => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark', // App is designed dark by default
      language: 'id',
      currency: 'IDR',
      biometricEnabled: false,
      notificationsEnabled: false,
      
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      setBiometricEnabled: (biometricEnabled) => set({ biometricEnabled }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
    }),
    {
      name: 'lemburin-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
