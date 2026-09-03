import type { UseQueryResult } from '@tanstack/react-query'
import type { BadgeState } from '@/components/page/source-badge'
import type { Sourced } from './fetchers'

/** Derive the section badge from a sourced query. */
export function badgeFor(...queries: UseQueryResult<Sourced<unknown>>[]): {
  source: BadgeState
  reason?: string
} {
  if (queries.some((q) => !q.data)) return { source: 'loading' }
  const offline = queries.find((q) => q.data?.source === 'snapshot')
  return offline
    ? { source: 'snapshot', reason: offline.data?.reason }
    : { source: 'live' }
}
