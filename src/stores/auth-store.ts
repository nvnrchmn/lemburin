import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web' || process.env.EXPO_OS === 'web';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  session: null,
  user: null,
  isLoading: !isWeb,
  isAuthenticated: false,
  setSession: session =>
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isLoading: false,
    }),
  setLoading: isLoading => set({ isLoading }),
  reset: () =>
    set({
      session: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
    }),
}));
