import { z } from 'zod'
import { fetchCsv, type FetchOptions } from '../fetchers'

/** Our World in Data grapher charts used by the demos. */
const OWID_DATASETS = {
  'life-expectancy': {
    label: 'Life expectancy',
    unit: 'years',
    column: 'life_expectancy_0',
  },
  'co-emissions-per-capita': {
    label: 'CO₂ emissions per capita',
    unit: 't CO₂',
    column: 'emissions_total_per_capita',
  },
  population: {
    label: 'Population',
    unit: 'people',
    column: 'population_historical',
  },
} as const

const owidSlugSchema = z.enum([
  'life-expectancy',
  'co-emissions-per-capita',
  'population',
])
export type OwidSlug = z.infer<typeof owidSlugSchema>

export const owidTableSchema = z.object({
  slug: owidSlugSchema,
  label: z.string(),
  unit: z.string(),
  years: z.array(z.number().int()),
  series: z.array(
    z.object({
      entity: z.string(),
      /** ISO 3166-1 alpha-3 country code. */
      code: z.string(),
      /** One value per entry in `years`; null when OWID has no observation. */
      values: z.array(z.number().nullable()),
    }),
  ),
})
export type OwidTable = z.infer<typeof owidTableSchema>

/**
 * The grapher CSV endpoint. `csvType=filtered` only returns a chart's default
 * selection (usually continents), so the country-level demos request `full`.
 */
function owidUrl(slug: OwidSlug, csvType: 'full' | 'filtered' = 'full'): string {
  return `https://ourworldindata.org/grapher/${slug}.csv?v=1&csvType=${csvType}&useColumnShortNames=true`
}

const rowSchema = z.object({
  entity: z.string().min(1),
  code: z.string(),
  year: z.coerce.number().int(),
})

export async function fetchOwid(
  slug: OwidSlug,
  { fromYear = 1950, ...options }: FetchOptions & { fromYear?: number } = {},
): Promise<OwidTable> {
  const rows = await fetchCsv(owidUrl(slug), options)
  const meta = OWID_DATASETS[slug]
  const byCode = new Map<string, { entity: string; points: Map<number, number> }>()
  const yearSet = new Set<number>()

  for (const raw of rows) {
    const parsed = rowSchema.safeParse(raw)
    if (!parsed.success) continue
    const { entity, code, year } = parsed.data
    // Countries only: aggregates use OWID_* codes or none at all.
    if (!/^[A-Z]{3}$/.test(code) || year < fromYear) continue
    const value = Number(raw[meta.column])
    if (!Number.isFinite(value)) continue
    let entry = byCode.get(code)
    if (!entry) {
      entry = { entity, points: new Map() }
      byCode.set(code, entry)
    }
    entry.points.set(year, value)
    yearSet.add(year)
  }

  if (byCode.size === 0)
    throw new Error(`OWID ${slug}: no country rows (column ${meta.column})`)
  const years = [...yearSet].sort((a, b) => a - b)
  return owidTableSchema.parse({
    slug,
    label: meta.label,
    unit: meta.unit,
    years,
    series: [...byCode.entries()]
      .map(([code, { entity, points }]) => ({
        entity,
        code,
        values: years.map((y) => points.get(y) ?? null),
      }))
      .sort((a, b) => a.entity.localeCompare(b.entity)),
  })
}

/** Round to `digits` significant figures to keep snapshots compact. */
export function roundSig(value: number, digits = 4): number {
  if (value === 0 || !Number.isFinite(value)) return value
  return Number(value.toPrecision(digits))
}

/**
 * Trim a table for the bundled snapshot: optionally keep only entities that
 * ever rank in the top N (plenty for a bar race) and round values.
 */
export function trimOwid(table: OwidTable, { topN }: { topN?: number } = {}): OwidTable {
  let series = table.series
  if (topN) {
    const keep = new Set<string>()
    table.years.forEach((_, yi) => {
      series
        .filter((s) => s.values[yi] !== null)
        .sort((a, b) => (b.values[yi] ?? 0) - (a.values[yi] ?? 0))
        .slice(0, topN)
        .forEach((s) => keep.add(s.code))
    })
    series = series.filter((s) => keep.has(s.code))
  }
  return {
    ...table,
    series: series.map((s) => ({
      ...s,
      values: s.values.map((v) => (v === null ? null : roundSig(v))),
    })),
  }
}
