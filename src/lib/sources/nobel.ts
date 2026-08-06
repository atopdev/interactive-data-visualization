import { z } from 'zod'
import { fetchJson, type FetchOptions } from '../fetchers'

const localized = z.object({ en: z.string() })
const place = z
  .object({ countryNow: localized.optional(), country: localized.optional() })
  .optional()

const laureateResponse = z.object({
  meta: z.object({ count: z.number() }),
  laureates: z.array(
    z.object({
      id: z.string(),
      knownName: localized.optional(),
      orgName: localized.optional(),
      gender: z.string().optional(),
      birth: z.object({ year: z.string().optional(), place }).optional(),
      founded: z.object({ date: z.string().optional(), place }).optional(),
      nobelPrizes: z.array(
        z.object({
          awardYear: z.string(),
          category: localized,
          portion: z.string(),
        }),
      ),
    }),
  ),
})

export const laureateSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** `male`, `female` or `org` for organizations. */
  gender: z.string(),
  country: z.string().nullable(),
  birthYear: z.number().int().nullable(),
  prizes: z.array(
    z.object({ year: z.number().int(), category: z.string(), portion: z.string() }),
  ),
})
export type Laureate = z.infer<typeof laureateSchema>

export const nobelSchema = z.object({ laureates: z.array(laureateSchema) })
export type NobelData = z.infer<typeof nobelSchema>

const URL_BASE = 'https://api.nobelprize.org/2.1/laureates?limit=1000'

function normalize(raw: z.infer<typeof laureateResponse>['laureates']): Laureate[] {
  return raw.map((l) => {
    const origin = l.birth ?? l.founded
    const year = Number(l.birth?.year ?? l.founded?.date?.slice(0, 4))
    return {
      id: l.id,
      name: l.knownName?.en ?? l.orgName?.en ?? 'Unknown',
      gender: l.orgName ? 'org' : (l.gender ?? 'unknown'),
      country: origin?.place?.countryNow?.en ?? origin?.place?.country?.en ?? null,
      birthYear: Number.isFinite(year) && year > 0 ? year : null,
      prizes: l.nobelPrizes.map((p) => ({
        year: Number(p.awardYear),
        category: p.category.en,
        portion: p.portion,
      })),
    }
  })
}

/** Every laureate (the API caps pages at 1000, so fetch a second page if needed). */
export async function fetchNobel(options?: FetchOptions): Promise<NobelData> {
  const first = await fetchJson(URL_BASE, laureateResponse, options)
  let laureates = first.laureates
  if (first.meta.count > laureates.length) {
    const rest = await fetchJson(
      `${URL_BASE}&offset=${laureates.length}`,
      laureateResponse,
      options,
    )
    laureates = laureates.concat(rest.laureates)
  }
  return { laureates: normalize(laureates) }
}
