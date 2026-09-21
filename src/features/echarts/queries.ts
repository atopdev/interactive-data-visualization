import { HOUR, MINUTE, parseSnapshot, sourcedQuery } from '@/lib/query'
import { candleSetSchema, fetchCandles } from '@/lib/sources/crypto'
import { fetchNobel, nobelSchema } from '@/lib/sources/nobel'
import { fetchNpmDownloads, npmDownloadsSchema } from '@/lib/sources/npm'
import {
  fetchTemperatureYear,
  fetchWeatherNow,
  temperatureYearSchema,
  weatherNowSchema,
} from '@/lib/sources/openmeteo'
import { fetchPokemon, pokemonListSchema } from '@/lib/sources/pokeapi'
import { fetchQuakes, quakeFeedSchema } from '@/lib/sources/usgs'
import { fetchWorldBank, worldBankSchema } from '@/lib/sources/worldbank'

// Query keys match the other pages so a visit anywhere warms the shared cache.

export const candlesQuery = () =>
  sourcedQuery({
    queryKey: ['crypto', 'btc', 'daily-candles'],
    live: (signal) => fetchCandles({ signal }),
    snapshot: () =>
      import('@/data/snapshots/candles.json').then(
        parseSnapshot(candleSetSchema),
      ),
    staleTime: 5 * MINUTE,
  })

/** World Bank is slow, so it is cached for a long time. */
export const worldBankQuery = () =>
  sourcedQuery({
    queryKey: ['worldbank', 'pop-gdp', '2000-2023'],
    live: (signal) => fetchWorldBank({ signal }),
    snapshot: () =>
      import('@/data/snapshots/worldbank.json').then(
        parseSnapshot(worldBankSchema),
      ),
    staleTime: 24 * HOUR,
  })

export const nobelQuery = () =>
  sourcedQuery({
    queryKey: ['nobel', 'laureates'],
    live: (signal) => fetchNobel({ signal }),
    snapshot: () =>
      import('@/data/snapshots/nobel.json').then(parseSnapshot(nobelSchema)),
    staleTime: 24 * HOUR,
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

export const weatherNowQuery = () =>
  sourcedQuery({
    queryKey: ['open-meteo', 'now', 'london'],
    live: (signal) => fetchWeatherNow(undefined, { signal }),
    snapshot: () =>
      import('@/data/snapshots/weather-now.json').then(
        parseSnapshot(weatherNowSchema),
      ),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

export const pokemonQuery = () =>
  sourcedQuery({
    queryKey: ['pokeapi', 'selection'],
    live: (signal) => fetchPokemon({ signal }),
    snapshot: () =>
      import('@/data/snapshots/pokemon.json').then(
        parseSnapshot(pokemonListSchema),
      ),
    staleTime: 24 * HOUR,
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
