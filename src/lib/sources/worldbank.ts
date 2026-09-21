import { z } from 'zod'
import { fetchJson, type FetchOptions } from '../fetchers'
import { roundSig } from './owid'

const WB = 'https://api.worldbank.org/v2'
const WB_FIRST_YEAR = 2000
const WB_LAST_YEAR = 2023

const WB_INDICATORS = {
  population: 'SP.POP.TOTL',
  gdpPerCapita: 'NY.GDP.PCAP.CD',
} as const

const metaSchema = z.object({
  page: z.coerce.number(),
  pages: z.coerce.number(),
})

const countriesResponse = z.tuple([
  metaSchema,
  z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      region: z.object({ value: z.string() }),
      incomeLevel: z.object({ value: z.string() }),
    }),
  ),
])

const indicatorRows = z
  .array(
    z.object({
      countryiso3code: z.string(),
      date: z.coerce.number().int(),
      value: z.number().nullable(),
    }),
  )
  .nullable()

const indicatorResponse = z.tuple([metaSchema, indicatorRows])

export const worldBankSchema = z.object({
  years: z.array(z.number().int()),
  countries: z.array(
    z.object({
      iso3: z.string(),
      name: z.string(),
      region: z.string(),
      income: z.string(),
      population: z.array(z.number().nullable()),
      gdpPerCapita: z.array(z.number().nullable()),
    }),
  ),
})
export type WorldBankData = z.infer<typeof worldBankSchema>

function indicatorUrl(indicator: string) {
  return `${WB}/country/all/indicator/${indicator}?format=json&date=${WB_FIRST_YEAR}:${WB_LAST_YEAR}&per_page=20000`
}

/** Population + GDP per capita for every (non-aggregate) country, 2000–2023. */
export async function fetchWorldBank(options?: FetchOptions): Promise<WorldBankData> {
  // The API is slow; the three requests run in parallel, each with its own timeout.
  const [countries, pop, gdp] = await Promise.all([
    fetchJson(`${WB}/country?format=json&per_page=400`, countriesResponse, options),
    fetchJson(indicatorUrl(WB_INDICATORS.population), indicatorResponse, options),
    fetchJson(indicatorUrl(WB_INDICATORS.gdpPerCapita), indicatorResponse, options),
  ])
  const years = Array.from(
    { length: WB_LAST_YEAR - WB_FIRST_YEAR + 1 },
    (_, i) => WB_FIRST_YEAR + i,
  )
  const index = (rows: z.infer<typeof indicatorRows>) => {
    const map = new Map<string, (number | null)[]>()
    for (const row of rows ?? []) {
      const yi = row.date - WB_FIRST_YEAR
      if (yi < 0 || yi >= years.length) continue
      let arr = map.get(row.countryiso3code)
      if (!arr) {
        arr = years.map(() => null)
        map.set(row.countryiso3code, arr)
      }
      arr[yi] = row.value
    }
    return map
  }
  const popBy = index(pop[1])
  const gdpBy = index(gdp[1])
  return worldBankSchema.parse({
    years,
    countries: countries[1]
      .filter((c) => c.region.value.trim() !== 'Aggregates')
      .map((c) => ({
        iso3: c.id,
        name: c.name,
        region: c.region.value.trim(),
        income: c.incomeLevel.value.trim(),
        population: popBy.get(c.id) ?? years.map(() => null),
        gdpPerCapita: gdpBy.get(c.id) ?? years.map(() => null),
      }))
      .filter((c) => c.population.some((v) => v !== null)),
  })
}

export function trimWorldBank(data: WorldBankData): WorldBankData {
  return {
    ...data,
    countries: data.countries.map((c) => ({
      ...c,
      population: c.population.map((v) => (v === null ? null : roundSig(v, 4))),
      gdpPerCapita: c.gdpPerCapita.map((v) => (v === null ? null : Math.round(v))),
    })),
  }
}
