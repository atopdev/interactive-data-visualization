import { HOUR, MINUTE, parseSnapshot, sourcedQuery } from '@/lib/query'
import { fetchNpmDownloads, npmDownloadsSchema } from '@/lib/sources/npm'
import { fetchQuakes, quakeFeedSchema } from '@/lib/sources/usgs'

/** Daily npm downloads over the last year for the five libraries. */
export const npmDownloadsQuery = () =>
  sourcedQuery({
    queryKey: ['npm', 'downloads', 'last-year'],
    live: (signal) => fetchNpmDownloads({ signal }),
    snapshot: () =>
      import('@/data/snapshots/npm-downloads.json').then(
        parseSnapshot(npmDownloadsSchema),
      ),
    staleTime: 6 * HOUR,
  })

/** USGS: every earthquake in the past week (feed refreshes every minute). */
export const quakesQuery = () =>
  sourcedQuery({
    queryKey: ['usgs', 'all-week'],
    live: (signal) => fetchQuakes({ signal }),
    snapshot: () =>
      import('@/data/snapshots/quakes.json').then(
        parseSnapshot(quakeFeedSchema),
      ),
    staleTime: MINUTE,
  })
