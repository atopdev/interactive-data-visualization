import { z } from 'zod'
import { fetchJson, type FetchOptions } from '../fetchers'

/** The animation/visualization libraries compared across the demos. */
export const NPM_PACKAGES = [
  'd3',
  'echarts',
  'gsap',
  'motion',
  '@react-spring/web',
] as const
export type NpmPackage = (typeof NPM_PACKAGES)[number]

const rangeResponse = z.object({
  start: z.string(),
  end: z.string(),
  package: z.string(),
  downloads: z.array(z.object({ day: z.string(), downloads: z.number() })),
})

export const npmDownloadsSchema = z.object({
  start: z.string(),
  end: z.string(),
  days: z.array(z.string()),
  packages: z.array(z.object({ name: z.string(), downloads: z.array(z.number()) })),
})
export type NpmDownloads = z.infer<typeof npmDownloadsSchema>

export async function fetchNpmDownloads(options?: FetchOptions): Promise<NpmDownloads> {
  const results = await Promise.all(
    NPM_PACKAGES.map((pkg) =>
      fetchJson(
        `https://api.npmjs.org/downloads/range/last-year/${pkg}`,
        rangeResponse,
        options,
      ),
    ),
  )
  // Align every package on the first package's day axis.
  const days = results[0].downloads.map((d) => d.day)
  return {
    start: results[0].start,
    end: results[0].end,
    days,
    packages: results.map((r) => {
      const byDay = new Map(r.downloads.map((d) => [d.day, d.downloads]))
      return { name: r.package, downloads: days.map((day) => byDay.get(day) ?? 0) }
    }),
  }
}
