/**
 * Platform-resolved font hook.
 *
 * Metro picks the implementation at bundle time:
 *   - use-app-fonts.native.ts  -> iOS / Android (loads real font files)
 *   - use-app-fonts.web.ts     -> web (fonts come from CSS, returns true)
 *
 * TypeScript does not understand Metro's platform extensions, so this barrel
 * file declares the shared contract both implementations satisfy.
 */
export declare function useAppFonts(): boolean;
