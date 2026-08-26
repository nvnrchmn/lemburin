import { useEffect, useState } from 'react';

/**
 * useFonts that returns [true] on web (fonts handled via CSS @font-face).
 * Prevents Suspense from hanging during SSR.
 */
export function useSafeFonts(fontMap: Record<string, unknown>): [boolean] {
  const isWeb = typeof window !== 'undefined' && 'document' in window;

  if (isWeb) {
    return [true];
  }

  // Mobile: lazy import actual useFonts
  try {
     
    const { useFonts: expoUseFonts } = require('@expo-google-fonts/plus-jakarta-sans');
    return expoUseFonts(fontMap);
  } catch {
    return [true]; // Fallback if module not available
  }
}
