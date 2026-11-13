import { useSyncExternalStore } from 'react';

/** Tracks a CSS media query; `false` where `matchMedia` is unavailable. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    notify => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => undefined;

      const list = window.matchMedia(query);

      list.addEventListener('change', notify);

      return () => list.removeEventListener('change', notify);
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  );
}
