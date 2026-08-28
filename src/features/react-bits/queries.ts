import { HOUR, parseSnapshot, sourcedQuery } from '@/lib/query'
import { fetchNpmDownloads, npmDownloadsSchema } from '@/lib/sources/npm'

/** npm downloads for the CountUp showcase (same cache key as the GSAP page). */
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
