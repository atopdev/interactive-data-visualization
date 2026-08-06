/**
 * Fetch every remote dataset once, trim it to what the demos need, and write
 * it to src/data/snapshots/*.json. The app falls back to these files when a
 * live request fails, is rate-limited or takes longer than 8s.
 *
 *   npm run snapshots
 *
 * A failing endpoint is reported but does not stop the run; the previous
 * snapshot (if any) is kept so the build stays usable offline.
 */
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { FetchOptions } from '../src/lib/fetchers.ts'
import { fetchCandles, trimCandles } from '../src/lib/sources/crypto.ts'
import { fetchFx } from '../src/lib/sources/frankfurter.ts'
import { fetchNobel } from '../src/lib/sources/nobel.ts'
import { fetchNpmDownloads } from '../src/lib/sources/npm.ts'
import { fetchTemperatureYear, fetchWeatherNow } from '../src/lib/sources/openmeteo.ts'
import { fetchOwid, trimOwid } from '../src/lib/sources/owid.ts'
import { fetchPokemon } from '../src/lib/sources/pokeapi.ts'
import { fetchQuakes, trimQuakes } from '../src/lib/sources/usgs.ts'
import { fetchPageviews } from '../src/lib/sources/wikimedia.ts'
import { fetchWorldBank, trimWorldBank } from '../src/lib/sources/worldbank.ts'

const OUT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/data/snapshots',
)
const MAX_BYTES = 200 * 1024
/** Generous timeout for a one-off script (the app itself uses 8s). */
const opts: FetchOptions = { timeoutMs: 45_000 }

interface Job {
  file: string
  endpoint: string
  run: () => Promise<unknown>
}

const jobs: Job[] = [
  {
    file: 'owid-life-expectancy.json',
    endpoint: 'ourworldindata.org/grapher/life-expectancy.csv',
    run: async () =>
      trimOwid(await fetchOwid('life-expectancy', { ...opts, fromYear: 1950 })),
  },
  {
    file: 'owid-co2.json',
    endpoint: 'ourworldindata.org/grapher/co-emissions-per-capita.csv',
    run: async () =>
      trimOwid(await fetchOwid('co-emissions-per-capita', { ...opts, fromYear: 1960 })),
  },
  {
    file: 'owid-population.json',
    endpoint: 'ourworldindata.org/grapher/population.csv',
    run: async () =>
      trimOwid(await fetchOwid('population', { ...opts, fromYear: 1950 }), { topN: 30 }),
  },
  {
    file: 'worldbank.json',
    endpoint: 'api.worldbank.org (SP.POP.TOTL, NY.GDP.PCAP.CD)',
    run: async () => trimWorldBank(await fetchWorldBank(opts)),
  },
  {
    file: 'weather-now.json',
    endpoint: 'api.open-meteo.com/v1/forecast',
    run: () => fetchWeatherNow(undefined, opts),
  },
  {
    file: 'temperature-year.json',
    endpoint: 'archive-api.open-meteo.com/v1/archive',
    run: () => fetchTemperatureYear(undefined, undefined, opts),
  },
  {
    file: 'quakes.json',
    endpoint: 'earthquake.usgs.gov all_week.geojson',
    run: async () => trimQuakes(await fetchQuakes(opts)),
  },
  {
    file: 'npm-downloads.json',
    endpoint: 'api.npmjs.org/downloads/range/last-year',
    run: () => fetchNpmDownloads(opts),
  },
  {
    file: 'pageviews.json',
    endpoint: 'wikimedia.org/api/rest_v1/metrics/pageviews',
    run: () => fetchPageviews(opts),
  },
  {
    file: 'fx.json',
    endpoint: 'api.frankfurter.dev/v1',
    run: () => fetchFx(opts),
  },
  {
    file: 'candles.json',
    endpoint: 'api.exchange.coinbase.com candles (Binance mirror fallback)',
    run: async () => trimCandles(await fetchCandles(opts)),
  },
  {
    file: 'nobel.json',
    endpoint: 'api.nobelprize.org/2.1/laureates',
    run: () => fetchNobel(opts),
  },
  {
    file: 'pokemon.json',
    endpoint: 'pokeapi.co/api/v2/pokemon',
    run: () => fetchPokemon(opts),
  },
]

mkdirSync(OUT_DIR, { recursive: true })

const results = await Promise.allSettled(
  jobs.map(async (job) => {
    const started = performance.now()
    const data = await job.run()
    const json = JSON.stringify(data)
    writeFileSync(path.join(OUT_DIR, job.file), json + '\n')
    return { job, bytes: Buffer.byteLength(json), ms: performance.now() - started }
  }),
)

let failures = 0
for (const [i, result] of results.entries()) {
  const job = jobs[i]
  if (result.status === 'fulfilled') {
    const kb = (result.value.bytes / 1024).toFixed(1)
    const warn = result.value.bytes > MAX_BYTES ? '  ⚠ over 200 KB' : ''
    console.log(
      `✔ ${job.file.padEnd(26)} ${kb.padStart(7)} KB  ${Math.round(result.value.ms)}ms${warn}`,
    )
  } else {
    failures++
    const target = path.join(OUT_DIR, job.file)
    const kept = existsSync(target)
      ? `kept previous (${(statSync(target).size / 1024).toFixed(1)} KB)`
      : 'NO SNAPSHOT'
    const reason =
      result.reason instanceof Error ? result.reason.message : String(result.reason)
    console.error(`✖ ${job.file.padEnd(26)} ${job.endpoint}\n    ${reason}\n    ${kept}`)
  }
}

console.log(`\n${jobs.length - failures}/${jobs.length} snapshots refreshed.`)
if (failures) process.exitCode = 1
