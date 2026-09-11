/**
 * WEB auth storage adapter for Supabase.
 * Wraps localStorage defensively: Safari private mode and storage-quota errors
 * throw on access, and an unhandled throw here would break auth entirely.
 */
const available = () => typeof window !== 'undefined' && !!window.localStorage;

export const authStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (!available()) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (!available()) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* private mode / quota exceeded */
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (!available()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* private mode / quota exceeded */
    }
  },
};
