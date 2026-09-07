import { HOUR, MINUTE, parseSnapshot, sourcedQuery } from '@/lib/query'
import { fetchFx, fxSchema } from '@/lib/sources/frankfurter'
import { fetchNobel, nobelSchema } from '@/lib/sources/nobel'
import { fetchNpmDownloads, npmDownloadsSchema } from '@/lib/sources/npm'
import { fetchTemperatureYear, temperatureYearSchema } from '@/lib/sources/openmeteo'
import { fetchOwid, owidTableSchema, type OwidSlug } from '@/lib/sources/owid'
import { fetchQuakes, quakeFeedSchema } from '@/lib/sources/usgs'
import { fetchPageviews, pageviewsSchema } from '@/lib/sources/wikimedia'

export const nobelQuery = () =>
  sourcedQuery({
    queryKey: ['nobel', 'laureates'],
    live: (signal) => fetchNobel({ signal }),
    snapshot: () =>
      import('@/data/snapshots/nobel.json').then(parseSnapshot(nobelSchema)),
    staleTime: 24 * HOUR,
  })

const OWID_SNAPSHOTS: Record<OwidSlug, () => Promise<{ default: unknown }>> = {
  'life-expectancy': () => import('@/data/snapshots/owid-life-expectancy.json'),
  'co-emissions-per-capita': () => import('@/data/snapshots/owid-co2.json'),
  population: () => import('@/data/snapshots/owid-population.json'),
}
const OWID_FROM: Record<OwidSlug, number> = {
  'life-expectancy': 1950,
  'co-emissions-per-capita': 1960,
  population: 1950,
}

export const owidQuery = (slug: OwidSlug) =>
  sourcedQuery({
    queryKey: ['owid', slug],
    live: (signal) => fetchOwid(slug, { signal, fromYear: OWID_FROM[slug] }),
    snapshot: () => OWID_SNAPSHOTS[slug]().then(parseSnapshot(owidTableSchema)),
    staleTime: 12 * HOUR,
  })

export const quakesQuery = () =>
  sourcedQuery({
    queryKey: ['usgs', 'all-week'],
    live: (signal) => fetchQuakes({ signal }),
    snapshot: () =>
      import('@/data/snapshots/quakes.json').then(parseSnapshot(quakeFeedSchema)),
    staleTime: MINUTE,
  })

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

export const fxQuery = () =>
  sourcedQuery({
    queryKey: ['frankfurter', 'year'],
    live: (signal) => fetchFx({ signal }),
    snapshot: () => import('@/data/snapshots/fx.json').then(parseSnapshot(fxSchema)),
    staleTime: 6 * HOUR,
  })

export const pageviewsQuery = () =>
  sourcedQuery({
    queryKey: ['wikimedia', 'pageviews'],
    live: (signal) => fetchPageviews({ signal }),
    snapshot: () =>
      import('@/data/snapshots/pageviews.json').then(parseSnapshot(pageviewsSchema)),
    staleTime: 6 * HOUR,
  })

export const temperatureYearQuery = () =>
  sourcedQuery({
    queryKey: ['open-meteo', 'archive', 'london'],
    live: (signal) => fetchTemperatureYear(undefined, undefined, { signal }),
    snapshot: () =>
      import('@/data/snapshots/temperature-year.json').then(
        parseSnapshot(temperatureYearSchema),
      ),
    staleTime: 24 * HOUR,
  })
