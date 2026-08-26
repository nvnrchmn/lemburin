import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

/**
 * NATIVE implementation (iOS / Android APK).
 * Loads the real font files — the app must wait for these before rendering,
 * otherwise text flashes in the system font.
 *
 * The web counterpart lives in use-app-fonts.web.ts and returns true
 * immediately, because on web the fonts come from CSS.
 */
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans-ExtraBold': PlusJakartaSans_800ExtraBold,
  });
  return loaded;
}
