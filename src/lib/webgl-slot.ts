import { useEffect, useSyncExternalStore, type RefObject } from 'react'

/**
 * Global "one WebGL context at a time" arbiter.
 *
 * Every WebGL demo registers with its visibility ratio (IntersectionObserver)
 * and a priority. Exactly one registered demo is active: the highest
 * priority, then the most visible. Inactive demos unmount their canvas (and
 * dispose the context), so the page never holds more than one live context.
 *
 * A small hysteresis stops two half-visible demos from flipping back and
 * forth (and re-creating contexts) on every scroll tick.
 */

interface Entry {
  ratio: number
  priority: number
}

const entries = new Map<string, Entry>()
const listeners = new Set<() => void>()
let active: string | null = null

const HYSTERESIS = 0.2
const score = (e: Entry) => (e.ratio > 0 ? e.priority * 10 + e.ratio : -1)

function recompute() {
  const current = active ? entries.get(active) : undefined
  let best: string | null = null
  let bestScore = -1
  for (const [id, e] of entries) {
    const s = score(e)
    if (s > bestScore) {
      bestScore = s
      best = id
    }
  }
  // Keep the incumbent unless it vanished or is clearly beaten.
  if (current && active && score(current) > 0 && best !== active) {
    if (bestScore < score(current) + HYSTERESIS) best = active
  }
  if (bestScore < 0) best = null
  if (best !== active) {
    active = best
    listeners.forEach((l) => l())
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const THRESHOLDS = [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1]

export interface WebGLSlotOptions {
  /** Higher priority wins regardless of visibility (e.g. a full-screen effect). */
  priority?: number
  /** Full-screen effects are always "visible" and ignore the element. */
  fullscreen?: boolean
  /** Unregister entirely (e.g. a toggle is off). */
  enabled?: boolean
}

/** Returns true while this demo owns the page's single WebGL context. */
export function useWebGLSlot(
  id: string,
  ref: RefObject<Element | null>,
  { priority = 0, fullscreen = false, enabled = true }: WebGLSlotOptions = {},
): boolean {
  useEffect(() => {
    if (!enabled) return
    const entry: Entry = { ratio: fullscreen ? 1 : 0, priority }
    entries.set(id, entry)
    recompute()
    let io: IntersectionObserver | null = null
    const el = ref.current
    if (!fullscreen && el) {
      io = new IntersectionObserver(
        ([e]) => {
          entry.ratio = e.isIntersecting ? Math.max(e.intersectionRatio, 0.001) : 0
          recompute()
        },
        { threshold: THRESHOLDS },
      )
      io.observe(el)
    }
    return () => {
      io?.disconnect()
      entries.delete(id)
      recompute()
    }
  }, [id, ref, priority, fullscreen, enabled])

  return useSyncExternalStore(
    subscribe,
    () => enabled && active === id,
    () => false,
  )
}
