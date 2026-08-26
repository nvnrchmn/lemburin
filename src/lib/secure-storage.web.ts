/**
 * WEB storage.
 * expo-secure-store has no web implementation, so we use localStorage.
 * This file is selected automatically by Metro on web, which means the native
 * modules are never even bundled for the browser.
 */
const STATE_KEY = 'lemburin-data-store';

const hasWindow = () => typeof window !== 'undefined' && !!window.localStorage;

export const secureStorage = {
  isWeb: true as const,

  getItem: async (name: string): Promise<string | null> => {
    if (!hasWindow()) return null;
    try {
      return window.localStorage.getItem(STATE_KEY) ?? window.localStorage.getItem(name);
    } catch (e) {
      console.warn('secureStorage.getItem failed:', e);
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    if (!hasWindow()) return;
    try {
      window.localStorage.removeItem(name);
      window.localStorage.setItem(STATE_KEY, value);
    } catch (e) {
      // Private mode / quota exceeded must not break the app.
      console.warn('secureStorage.setItem failed:', e);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    if (!hasWindow()) return;
    try {
      window.localStorage.removeItem(name);
      window.localStorage.removeItem(STATE_KEY);
    } catch (e) {
      console.warn('secureStorage.removeItem failed:', e);
    }
  },
};
