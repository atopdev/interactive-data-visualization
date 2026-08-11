import { queryOptions, type QueryKey } from '@tanstack/react-query'
import type { z } from 'zod'
import { withSnapshotFallback, type Sourced } from './fetchers'

export const HOUR = 60 * 60 * 1000
export const MINUTE = 60 * 1000

interface SourcedQueryConfig<T> {
  queryKey: QueryKey
  live: (signal: AbortSignal | undefined) => Promise<T>
  /** Lazily import and validate the bundled snapshot. */
  snapshot: () => Promise<T>
  staleTime: number
  refetchInterval?: number
}

/**
 * queryOptions for a remote dataset with an offline snapshot fallback. The
 * queryFn itself never rejects on network failure; it resolves the snapshot
 * and tags it so the section can show an "offline snapshot" badge.
 */
export function sourcedQuery<T>({
  queryKey,
  live,
  snapshot,
  staleTime,
  refetchInterval,
}: SourcedQueryConfig<T>) {
  // Callers pass a queryKey that fully identifies `live`/`snapshot`; the
  // functions themselves are not serialisable key material.
  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  return queryOptions<Sourced<T>>({
    queryKey,
    queryFn: ({ signal }) => withSnapshotFallback({ live, snapshot, signal }),
    staleTime,
    gcTime: Math.max(staleTime, 30 * MINUTE),
    retry: 1,
    refetchInterval,
  })
}

/** Parse an imported JSON module with the dataset's Zod schema. */
export function parseSnapshot<S extends z.ZodType>(schema: S) {
  return (mod: { default: unknown }): z.output<S> => schema.parse(mod.default)
}

/**
 * Prefetch a page's datasets from its route loader. Waits for the data so
 * the entrance animation starts with charts ready, but never holds the
 * transition overlay for longer than `budgetMs`; slower sources keep loading
 * in the background and their sections show skeletons meanwhile.
 */
export async function ensureWithBudget(
  pending: readonly Promise<unknown>[],
  budgetMs = 2500,
): Promise<void> {
  await Promise.race([
    Promise.allSettled(pending),
    new Promise((resolve) => setTimeout(resolve, budgetMs)),
  ])
}
