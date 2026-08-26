# Platform Split: Web vs Native (APK)

Lemburin ships as **both** an Expo web app (`lemburin.logikraf.id`) and an
Android APK from the same source. This document exists because a web-only fix
previously broke the APK, and vice versa.

## The rule

**Never branch on `Platform.OS` inside a module that imports a native-only
package.** Use Metro's platform extensions instead.

```
src/lib/secure-storage.native.ts   <- imported on iOS/Android only
src/lib/secure-storage.web.ts      <- imported on web only
src/lib/secure-storage.d.ts        <- shared type contract (for tsc)
```

Consumers import the **base path** and Metro picks the right file:

```ts
import { secureStorage } from '@/lib/secure-storage';
```

Why this beats a runtime `if (Platform.OS === 'web')`:

- The web bundle never even contains the native module, so it cannot throw.
- `require()` inside a conditional defeats static analysis and hides typos
  until runtime on a real device.
- TypeScript still checks both implementations against one contract.

The `.d.ts` barrel is required because `tsc` does not understand Metro's
platform extensions and would otherwise report `Cannot find module`.

## Current platform-split modules

| Base                      | Native                                       | Web                                 |
| ------------------------- | -------------------------------------------- | ----------------------------------- |
| `src/hooks/use-app-fonts` | loads Plus Jakarta Sans via `expo-font`      | returns `true`; fonts come from CSS |
| `src/lib/secure-storage`  | `expo-secure-store` + AsyncStorage migration | `window.localStorage`               |
| `src/lib/auth-storage`    | `AsyncStorage` (static import)               | `window.localStorage` (guarded)     |

## Before shipping any change

```bash
bash scripts/verify-native.sh
```

This runs typecheck, lint, unit tests, the platform-pair check, and — most
importantly — **actually builds the Android bundle**, which is the only way to
prove the APK graph still compiles. CI runs the same steps via
`.github/workflows/verify-native.yml`.

## Regressions this guards against

These are real bugs that shipped, each caught only after the fact:

1. **`const [fontsLoaded] = [true]`** — `useFonts` was deleted while debugging
   web. The APK stopped loading Plus Jakarta Sans and silently fell back to the
   system font.

2. **`require('expo-secure-store').SecureStore`** — the module exports its
   functions directly (`getItemAsync`, `setItemAsync`, `deleteItemAsync`); there
   is no `SecureStore` wrapper. The destructure produced `undefined` and would
   crash on device when saving data. `verify-native.sh` now greps for this.

3. **Removing `<style id="expo-reset">`** — that stylesheet carries
   `height:100%` / `display:flex`, which react-native-web needs. Removing it
   collapsed `#root` to zero height: DOM present, nothing visible.

4. **Missing `darkMode: 'class'` in `tailwind.config.js`** — NativeWind then
   refuses a manual `setColorScheme()` call and **throws during the first
   render**, so React mounts nothing at all (blank white page).

5. **`await import()` for Supabase auth storage on native** — async resolution
   meant Supabase could read the session before the module was ready, losing the
   login on cold start. Native now imports AsyncStorage statically.

## Testing web changes properly

JSDOM is **not** sufficient: it does not compute CSS layout, so it happily
reports "rendered" for a page whose `#root` has zero height. Verify with real
headless Chrome and assert on:

- `#root.children.length > 0` (React actually mounted)
- `#root` bounding height > 100px (layout did not collapse)
- zero `pageerror` events
- zero responses with status >= 400
