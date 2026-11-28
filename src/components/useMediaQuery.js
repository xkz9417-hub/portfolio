import { useCallback, useSyncExternalStore } from 'react';

export const COMPACT_MOTION = '(max-width: 700px), (pointer: coarse)';
export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

export function useMediaQuery(query) {
  const subscribe = useCallback(callback => {
    const media = window.matchMedia(query);
    media.addEventListener('change', callback);
    return () => media.removeEventListener('change', callback);
  }, [query]);
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, getSnapshot);
}
