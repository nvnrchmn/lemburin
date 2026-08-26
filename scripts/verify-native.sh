#!/usr/bin/env bash
# Verifies that a change intended for web did not break the native (APK) build.
# Run from the repo root:  bash scripts/verify-native.sh
set -uo pipefail

cd "$(dirname "$0")/.."
FAIL=0

step() { printf '\n\033[1m== %s ==\033[0m\n' "$1"; }
ok()   { printf '  \033[32mPASS\033[0m %s\n' "$1"; }
bad()  { printf '  \033[31mFAIL\033[0m %s\n' "$1"; FAIL=1; }

step "TypeScript"
if npx tsc --noEmit 2>&1 | grep -q 'error TS'; then
  bad "typecheck reported errors"
  npx tsc --noEmit 2>&1 | grep 'error TS' | head -10
else
  ok "no type errors"
fi

step "ESLint (source only)"
LINT_ERRS=$(npx eslint . 2>&1 | grep -oE '[0-9]+ error' | head -1 | grep -oE '[0-9]+' || echo 0)
if [ "${LINT_ERRS:-0}" -gt 0 ]; then
  bad "$LINT_ERRS lint error(s)"
else
  ok "0 lint errors"
fi

step "Unit tests"
if npx vitest run 2>&1 | tail -5 | grep -q 'failed'; then
  bad "unit tests failing"
else
  ok "all unit tests pass"
fi

step "Native-only modules must not be imported unconditionally on shared paths"
# expo-secure-store exports functions directly; a `{ SecureStore }` destructure
# yields undefined and crashes only at runtime on device.
if grep -rn "{ *SecureStore *}" src/ --include=*.ts --include=*.tsx 2>/dev/null; then
  bad "invalid 'import { SecureStore }' found (module exports functions directly)"
else
  ok "no invalid SecureStore destructuring"
fi

step "Platform-specific pairs are complete"
for base in src/hooks/use-app-fonts src/lib/secure-storage src/lib/auth-storage; do
  if [ -f "$base.native.ts" ] && [ -f "$base.web.ts" ] && [ -f "$base.d.ts" ]; then
    ok "$(basename "$base"): native + web + types"
  else
    bad "$(basename "$base"): missing one of .native.ts / .web.ts / .d.ts"
  fi
done

step "Native bundle builds (Android)"
# This is the real gate: it compiles the exact graph the APK uses.
if npx expo export --platform android --output-dir /tmp/native-check >/tmp/native-build.log 2>&1; then
  ok "android bundle exported successfully"
  rm -rf /tmp/native-check
else
  bad "android bundle FAILED to build"
  tail -20 /tmp/native-build.log
fi

printf '\n'
if [ "$FAIL" -eq 0 ]; then
  printf '\033[32m=== NATIVE BUILD SAFE ===\033[0m\n'
else
  printf '\033[31m=== NATIVE BUILD AT RISK - fix above before shipping ===\033[0m\n'
fi
exit "$FAIL"
