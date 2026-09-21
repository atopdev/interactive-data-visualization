import { z } from 'zod'
import { fetchJson, type FetchOptions } from '../fetchers'

const USGS_WEEK_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'

const featureCollection = z.object({
  metadata: z.object({ generated: z.number(), count: z.number() }),
  features: z.array(
    z.object({
      id: z.string(),
      properties: z.object({
        mag: z.number().nullable(),
        place: z.string().nullable(),
        time: z.number(),
        type: z.string(),
      }),
      geometry: z.object({
        coordinates: z.tuple([z.number(), z.number(), z.number()]),
      }),
    }),
  ),
})

const quakeSchema = z.object({
  id: z.string(),
  mag: z.number(),
  place: z.string(),
  time: z.number(),
  lon: z.number(),
  lat: z.number(),
  depth: z.number(),
})
export type Quake = z.infer<typeof quakeSchema>

export const quakeFeedSchema = z.object({
  generated: z.number(),
  quakes: z.array(quakeSchema),
})
export type QuakeFeed = z.infer<typeof quakeFeedSchema>

export async function fetchQuakes(options?: FetchOptions): Promise<QuakeFeed> {
  const res = await fetchJson(USGS_WEEK_URL, featureCollection, options)
  return {
    generated: res.metadata.generated,
    quakes: res.features.flatMap((f) => {
      const { mag, place, time, type } = f.properties
      if (mag === null || type !== 'earthquake') return []
      const [lon, lat, depth] = f.geometry.coordinates
      return [
        {
          id: f.id,
          mag,
          place: place ?? 'Unknown location',
          time,
          lon,
          lat,
          depth,
        },
      ]
    }),
  }
}

/** Keep the snapshot small: drop micro-quakes and cap the count. */
export function trimQuakes(feed: QuakeFeed, { minMag = 1.5, max = 900 } = {}): QuakeFeed {
  return {
    generated: feed.generated,
    quakes: feed.quakes
      .filter((q) => q.mag >= minMag)
      .sort((a, b) => b.mag - a.mag)
      .slice(0, max)
      .map((q) => ({
        ...q,
        lon: Number(q.lon.toFixed(3)),
        lat: Number(q.lat.toFixed(3)),
        depth: Number(q.depth.toFixed(1)),
      })),
  }
}
