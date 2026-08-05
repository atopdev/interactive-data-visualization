import { csvParse, type DSVRowString } from 'd3-dsv'
import type { z } from 'zod'

/** Where a demo's data came from; drives the badge on every section. */
export type DataSource = 'live' | 'snapshot' | 'generated'

/** A dataset tagged with its provenance. */
export interface Sourced<T> {
  data: T
  source: Exclude<DataSource, 'generated'>
  /** Epoch ms when the data was resolved. */
  fetchedAt: number
  /** Why the live request was abandoned, when we fell back. */
  reason?: string
}

/** Requests slower than this fall back to the bundled snapshot. */
export const REQUEST_TIMEOUT_MS = 8_000

export class HttpError extends Error {
  readonly status: number
  readonly url: string
  constructor(status: number, url: string) {
    super(`HTTP ${status} for ${url}`)
    this.name = 'HttpError'
    this.status = status
    this.url = url
  }
}

export interface FetchOptions {
  signal?: AbortSignal
  timeoutMs?: number
  headers?: Record<string, string>
}

function combinedSignal({ signal, timeoutMs = REQUEST_TIMEOUT_MS }: FetchOptions) {
  const timeout = AbortSignal.timeout(timeoutMs)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}

async function request(url: string, options: FetchOptions = {}): Promise<Response> {
  const res = await fetch(url, {
    signal: combinedSignal(options),
    headers: options.headers,
  })
  if (!res.ok) throw new HttpError(res.status, url)
  return res
}

/** Fetch JSON and validate it with a Zod schema. Throws on HTTP, timeout or shape errors. */
export async function fetchJson<S extends z.ZodType>(
  url: string,
  schema: S,
  options?: FetchOptions,
): Promise<z.output<S>> {
  const res = await request(url, options)
  const json: unknown = await res.json()
  return schema.parse(json)
}

export async function fetchText(url: string, options?: FetchOptions): Promise<string> {
  const res = await request(url, options)
  return res.text()
}

/** Fetch a CSV file and parse it with d3-dsv. */
export async function fetchCsv(
  url: string,
  options?: FetchOptions,
): Promise<DSVRowString<string>[]> {
  return csvParse(await fetchText(url, options))
}

function describeError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return `timed out after ${REQUEST_TIMEOUT_MS / 1000}s`
  }
  if (error instanceof HttpError) {
    return error.status === 429 ? 'rate-limited (429)' : `HTTP ${error.status}`
  }
  if (error instanceof Error) return error.message
  return 'unknown error'
}

function isRetryable(error: unknown): boolean {
  // Timeouts already cost 8s; retrying would double the wait. Rate limits
  // won't clear in time either. Network blips and 5xx get one more try.
  if (error instanceof DOMException) return false
  if (error instanceof HttpError) return error.status >= 500
  return true
}

export interface SnapshotFallbackOptions<T> {
  live: (signal: AbortSignal | undefined) => Promise<T>
  snapshot: () => Promise<T>
  signal?: AbortSignal
  /** Additional live attempts on retryable errors (mirrors TanStack's `retry: 1`). */
  retries?: number
}

/**
 * Try the live source; on failure, rate limit or timeout resolve the bundled
 * snapshot instead. Never rejects unless the snapshot itself fails to load,
 * which keeps the app usable offline.
 */
export async function withSnapshotFallback<T>({
  live,
  snapshot,
  signal,
  retries = 1,
}: SnapshotFallbackOptions<T>): Promise<Sourced<T>> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await live(signal)
      return { data, source: 'live', fetchedAt: Date.now() }
    } catch (error) {
      lastError = error
      if (signal?.aborted || !isRetryable(error)) break
    }
  }
  if (signal?.aborted) throw signal.reason
  const data = await snapshot()
  if (import.meta.env.DEV) {
    console.warn('[data] falling back to snapshot:', describeError(lastError))
  }
  return {
    data,
    source: 'snapshot',
    fetchedAt: Date.now(),
    reason: describeError(lastError),
  }
}

/** Format a Date as YYYY-MM-DD in UTC. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Shift a date by whole days (UTC). */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}
