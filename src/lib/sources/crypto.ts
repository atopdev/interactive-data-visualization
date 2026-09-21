import { z } from 'zod'
import { fetchJson, type FetchOptions } from '../fetchers'

export const COINBASE_WS_URL = 'wss://ws-feed.exchange.coinbase.com'

const candleSchema = z.object({
  /** Candle open time, epoch ms. */
  time: z.number(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
})
export type Candle = z.infer<typeof candleSchema>

export const candleSetSchema = z.object({
  product: z.string(),
  provider: z.enum(['coinbase', 'binance']),
  candles: z.array(candleSchema),
})
export type CandleSet = z.infer<typeof candleSetSchema>

// Coinbase: [time(s), low, high, open, close, volume], newest first, max 300.
const coinbaseResponse = z.array(
  z.tuple([z.number(), z.number(), z.number(), z.number(), z.number(), z.number()]),
)

// Binance: [openTime(ms), "open", "high", "low", "close", "volume", ...].
const binanceResponse = z.array(
  z
    .tuple([z.number(), z.string(), z.string(), z.string(), z.string(), z.string()])
    .rest(z.union([z.number(), z.string()])),
)

async function fetchCoinbaseCandles(options?: FetchOptions): Promise<CandleSet> {
  const rows = await fetchJson(
    'https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=86400',
    coinbaseResponse,
    options,
  )
  return {
    product: 'BTC-USD',
    provider: 'coinbase',
    candles: rows
      .map(([t, low, high, open, close, volume]) => ({
        time: t * 1000,
        open,
        high,
        low,
        close,
        volume,
      }))
      .sort((a, b) => a.time - b.time),
  }
}

async function fetchBinanceCandles(options?: FetchOptions): Promise<CandleSet> {
  const rows = await fetchJson(
    'https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=300',
    binanceResponse,
    options,
  )
  return {
    product: 'BTC-USDT',
    provider: 'binance',
    candles: rows.map(([time, open, high, low, close, volume]) => ({
      time,
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume),
    })),
  }
}

/** Coinbase first, then the Binance public mirror. */
export async function fetchCandles(options?: FetchOptions): Promise<CandleSet> {
  try {
    return await fetchCoinbaseCandles(options)
  } catch (error) {
    if (options?.signal?.aborted) throw error
    return fetchBinanceCandles(options)
  }
}

export function trimCandles(set: CandleSet): CandleSet {
  const r = (n: number) => Math.round(n * 100) / 100
  return {
    ...set,
    candles: set.candles.map((c) => ({
      time: c.time,
      open: r(c.open),
      high: r(c.high),
      low: r(c.low),
      close: r(c.close),
      volume: Math.round(c.volume),
    })),
  }
}

/** Ticker message from the Coinbase `ticker` channel. */
export const tickerMessageSchema = z.object({
  type: z.literal('ticker'),
  product_id: z.string(),
  price: z.coerce.number(),
  time: z.string().optional(),
  best_bid: z.coerce.number().optional(),
  best_ask: z.coerce.number().optional(),
  last_size: z.coerce.number().optional(),
})
