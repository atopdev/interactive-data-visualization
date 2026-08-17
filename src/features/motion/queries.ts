import { MINUTE, parseSnapshot, sourcedQuery } from '@/lib/query'
import { candleSetSchema, fetchCandles } from '@/lib/sources/crypto'

/** Daily BTC candles (Coinbase, Binance mirror fallback); seeds the live ticker. */
export const candlesQuery = () =>
  sourcedQuery({
    queryKey: ['crypto', 'btc', 'daily-candles'],
    live: (signal) => fetchCandles({ signal }),
    snapshot: () =>
      import('@/data/snapshots/candles.json').then(parseSnapshot(candleSetSchema)),
    staleTime: 5 * MINUTE,
  })
