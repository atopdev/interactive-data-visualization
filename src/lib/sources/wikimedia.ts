import { z } from 'zod'
import { addDays, fetchJson, type FetchOptions } from '../fetchers'

const WIKI_ARTICLES = ['D3.js', 'Data_visualization', 'Infographic'] as const

const pageviewsResponse = z.object({
  items: z.array(
    z.object({ article: z.string(), timestamp: z.string(), views: z.number() }),
  ),
})

export const pageviewsSchema = z.object({
  articles: z.array(
    z.object({
      article: z.string(),
      points: z.array(z.object({ date: z.string(), views: z.number() })),
    }),
  ),
})
export type Pageviews = z.infer<typeof pageviewsSchema>

const compact = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')

/** Daily views over the last year (ending two days ago; the API lags a day). */
export async function fetchPageviews(
  options?: FetchOptions,
): Promise<Pageviews> {
  const end = addDays(new Date(), -2)
  const start = addDays(end, -364)
  const articles = await Promise.all(
    WIKI_ARTICLES.map(async (article) => {
      const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodeURIComponent(article)}/daily/${compact(start)}/${compact(end)}`
      const res = await fetchJson(url, pageviewsResponse, options)
      return {
        article,
        points: res.items.map((it) => ({
          date: `${it.timestamp.slice(0, 4)}-${it.timestamp.slice(4, 6)}-${it.timestamp.slice(6, 8)}`,
          views: it.views,
        })),
      }
    }),
  )
  return { articles }
}
