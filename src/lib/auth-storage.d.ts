/**
 * Platform-resolved Supabase auth storage adapter.
 *
 * Metro picks the implementation at bundle time:
 *   - auth-storage.native.ts -> AsyncStorage (imported statically)
 *   - auth-storage.web.ts    -> window.localStorage (guarded)
 *
 * TypeScript does not understand Metro's platform extensions, so this barrel
 * file declares the shared contract both implementations satisfy.
 */
export declare const authStorage: {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
};
