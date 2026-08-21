import { MINUTE, parseSnapshot, sourcedQuery } from '@/lib/query'
import { candleSetSchema, fetchCandles } from '@/lib/sources/crypto'
import { fetchWeatherNow, weatherNowSchema } from '@/lib/sources/openmeteo'

/** Current conditions from Open-Meteo; live data, so a short staleTime. */
export const weatherNowQuery = () =>
  sourcedQuery({
    queryKey: ['open-meteo', 'now', 'london'],
    live: (signal) => fetchWeatherNow(undefined, { signal }),
    snapshot: () =>
      import('@/data/snapshots/weather-now.json').then(parseSnapshot(weatherNowSchema)),
    staleTime: 30_000,
  })

/** Daily BTC candles (shared cache key with the Motion and ECharts pages). */
export const candlesQuery = () =>
  sourcedQuery({
    queryKey: ['crypto', 'btc', 'daily-candles'],
    live: (signal) => fetchCandles({ signal }),
    snapshot: () =>
      import('@/data/snapshots/candles.json').then(parseSnapshot(candleSetSchema)),
    staleTime: 5 * MINUTE,
  })
