import { z } from 'zod'
import { addDays, fetchJson, isoDate, type FetchOptions } from '../fetchers'

const FRANKFURTER = 'https://api.frankfurter.dev/v1'
const FX_CURRENCIES = ['USD', 'JPY', 'GBP', 'CHF', 'CAD', 'AUD', 'CNY', 'INR'] as const

const latestResponse = z.object({
  base: z.string(),
  date: z.string(),
  rates: z.record(z.string(), z.number()),
})

const seriesResponse = z.object({
  base: z.string(),
  rates: z.record(z.string(), z.record(z.string(), z.number())),
})

export const fxSchema = z.object({
  base: z.string(),
  latestDate: z.string(),
  latest: z.record(z.string(), z.number()),
  currencies: z.array(z.string()),
  dates: z.array(z.string()),
  /** currency -> one rate per date (units per 1 base). */
  series: z.record(z.string(), z.array(z.number())),
})
export type FxData = z.infer<typeof fxSchema>

/** Latest EUR rates plus a one-year daily series for the tracked currencies. */
export async function fetchFx(options?: FetchOptions): Promise<FxData> {
  const start = isoDate(addDays(new Date(), -365))
  const [latest, series] = await Promise.all([
    fetchJson(`${FRANKFURTER}/latest`, latestResponse, options),
    fetchJson(
      `${FRANKFURTER}/${start}..?to=${FX_CURRENCIES.join(',')}`,
      seriesResponse,
      options,
    ),
  ])
  const dates = Object.keys(series.rates).sort()
  const currencies = FX_CURRENCIES.filter((c) => dates.every((d) => c in series.rates[d]))
  return {
    base: latest.base,
    latestDate: latest.date,
    latest: latest.rates,
    currencies,
    dates,
    series: Object.fromEntries(
      currencies.map((c) => [c, dates.map((d) => series.rates[d][c])]),
    ),
  }
}
