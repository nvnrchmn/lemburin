import { useColorScheme } from 'react-native';

import { useSettingsStore } from '@/stores/settings-store';

export const appThemeColors = {
  dark: {
    background: '#0F172A',
    card: '#1E293B',
    border: '#334155',
    text: '#F8FAFC',
    muted: '#94A3B8',
    overlay: 'rgba(2, 6, 23, 0.72)',
  },
  light: {
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    muted: '#64748B',
    overlay: 'rgba(15, 23, 42, 0.42)',
  },
} as const;

export function useAppTheme() {
  const preference = useSettingsStore(state => state.theme);
  const systemScheme = useColorScheme();
  const resolvedTheme: 'dark' | 'light' =
    preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;

  return {
    preference,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    colors: appThemeColors[resolvedTheme],
  };
}
