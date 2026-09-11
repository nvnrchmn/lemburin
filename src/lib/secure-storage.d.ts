/**
 * Platform-resolved secure storage.
 *
 * Metro picks the implementation at bundle time:
 *   - secure-storage.native.ts -> expo-secure-store (+ AsyncStorage migration)
 *   - secure-storage.web.ts    -> window.localStorage
 *
 * TypeScript does not understand Metro's platform extensions, so this barrel
 * file declares the shared contract both implementations satisfy.
 */
export declare const secureStorage: {
  isWeb: boolean;
  getItem: (name: string) => Promise<string | null>;
  setItem: (name: string, value: string) => Promise<void>;
  removeItem: (name: string) => Promise<void>;
};
