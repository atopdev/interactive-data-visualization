import { useSyncExternalStore } from 'react'

/**
 * Global page-transition phase. Demo pages read it so their own entrance
 * animations start only once the overlay has lifted.
 *
 * covering → covered (router loads/renders underneath) → revealing → idle
 */
export type TransitionPhase = 'covering' | 'covered' | 'revealing' | 'idle'

let phase: TransitionPhase = 'covered'
const listeners = new Set<() => void>()

export function setTransitionPhase(next: TransitionPhase) {
  if (phase === next) return
  phase = next
  listeners.forEach((l) => l())
}

export function getTransitionPhase(): TransitionPhase {
  return phase
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTransitionPhase(): TransitionPhase {
  return useSyncExternalStore(subscribe, getTransitionPhase, getTransitionPhase)
}

/** True once the current page is visible (revealing or idle). */
export function usePageRevealed(): boolean {
  const p = useTransitionPhase()
  return p === 'revealing' || p === 'idle'
}
