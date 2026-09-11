/**
 * WEB implementation.
 * On web the Plus Jakarta Sans family is delivered via CSS (@font-face /
 * Google Fonts), so there is nothing to wait for. Returning true immediately
 * prevents the root layout from getting stuck on `if (!fontsLoaded) return null`,
 * which would render a blank white page.
 *
 * The native counterpart lives in use-app-fonts.native.ts and really does
 * load the font files via expo-font.
 */
export function useAppFonts(): boolean {
  return true;
}
