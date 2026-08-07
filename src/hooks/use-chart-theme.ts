import { useSyncExternalStore } from 'react'
import { readChartTheme, type ChartTheme } from '@/lib/colors'

/*
 * A tiny external store that re-reads theme colors whenever <html>'s class
 * (dark mode) or data-page (page accent) changes. Every chart subscribes to
 * the same observer, and the snapshot object is stable between changes.
 */
let snapshot: ChartTheme | null = null
const listeners = new Set<() => void>()
let observer: MutationObserver | null = null

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!observer) {
    observer = new MutationObserver(() => {
      snapshot = readChartTheme()
      listeners.forEach((l) => l())
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-page'],
    })
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      observer?.disconnect()
      observer = null
    }
  }
}

function getSnapshot(): ChartTheme {
  snapshot ??= readChartTheme()
  return snapshot
}

/** Theme colors resolved to rgb strings, updated on theme/page changes. */
export function useChartTheme(): ChartTheme {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
