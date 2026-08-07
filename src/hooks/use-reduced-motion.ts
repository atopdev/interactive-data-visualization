import { useSyncExternalStore } from 'react'

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

export const prefersReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches

/** Library-agnostic reduced-motion flag (for D3, ECharts, React Spring, canvas). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false)
}
