import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { DemoPage, type DataCredit, type TocEntry } from '@/components/page/demo-page'
import { EChartsBonusDemo } from '@/features/echarts/demos/bonus'
import { CalendarHeatmapDemo } from '@/features/echarts/demos/calendar-heatmap'
import { CandlestickDemo } from '@/features/echarts/demos/candlestick'
import { GaugesDemo } from '@/features/echarts/demos/gauges'
import { HierarchyMorphDemo } from '@/features/echarts/demos/hierarchy-morph'
import { LiveStreamDemo } from '@/features/echarts/demos/live-stream'
import { NobelGraphDemo, NobelSankeyDemo } from '@/features/echarts/demos/nobel-graph'
import { PokemonDemo } from '@/features/echarts/demos/pokemon'
import { RealtimeRaceDemo } from '@/features/echarts/demos/realtime-race'
import {
  candlesQuery,
  nobelQuery,
  npmDownloadsQuery,
  pokemonQuery,
  quakesQuery,
  temperatureYearQuery,
  weatherNowQuery,
  worldBankQuery,
} from '@/features/echarts/queries'
import { ensureWithBudget } from '@/lib/query'

export const Route = createFileRoute('/echarts')({
  validateSearch: z.object({ demo: z.string().optional().catch(undefined) }),
  loader: ({ context: { queryClient } }) =>
    ensureWithBudget([
      queryClient.ensureQueryData(candlesQuery()),
      queryClient.ensureQueryData(worldBankQuery()),
      queryClient.ensureQueryData(nobelQuery()),
      queryClient.ensureQueryData(temperatureYearQuery()),
      queryClient.ensureQueryData(weatherNowQuery()),
      queryClient.ensureQueryData(pokemonQuery()),
      queryClient.ensureQueryData(npmDownloadsQuery()),
      queryClient.ensureQueryData(quakesQuery()),
    ]),
  component: EChartsPage,
})

const TOC: TocEntry[] = [
  { id: 'live', title: 'Live stream' },
  { id: 'candles', title: 'Candlestick' },
  { id: 'race', title: 'realtimeSort race' },
  { id: 'graph', title: 'Force graph' },
  { id: 'sankey', title: 'Sankey' },
  { id: 'calendar', title: 'Calendar heatmap' },
  { id: 'gauges', title: 'Gauges' },
  { id: 'morph', title: 'Treemap ↔ sunburst' },
  { id: 'pokemon', title: 'Radar & parallel' },
  { id: 'bonus', title: 'Bonus' },
]

const CREDITS: DataCredit[] = [
  {
    name: 'Coinbase Exchange API',
    url: 'https://docs.cdp.coinbase.com/exchange/docs/websocket-overview',
    note: 'BTC-USD ticker WebSocket and daily candles',
  },
  {
    name: 'Binance public data mirror',
    url: 'https://data-api.binance.vision',
    note: 'Backup daily candles',
  },
  {
    name: 'World Bank Indicators API',
    url: 'https://datahelpdesk.worldbank.org/knowledgebase/articles/889392',
    note: 'Population (SP.POP.TOTL) and GDP per capita (NY.GDP.PCAP.CD), CC BY 4.0',
  },
  {
    name: 'Nobel Prize API v2.1',
    url: 'https://www.nobelprize.org/about/developer-zone-2/',
    note: 'Laureates and prizes',
  },
  {
    name: 'Open-Meteo',
    url: 'https://open-meteo.com',
    note: 'Current weather and daily temperature archive (CC BY 4.0)',
  },
  { name: 'PokeAPI', url: 'https://pokeapi.co', note: 'Pokémon base stats' },
  {
    name: 'npm registry downloads API',
    url: 'https://github.com/npm/registry/blob/main/docs/download-counts.md',
    note: 'Daily downloads',
  },
  {
    name: 'USGS Earthquake Hazards Program',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php',
    note: 'Past-week earthquake feed',
  },
]

function EChartsPage() {
  const { demo } = Route.useSearch()
  return (
    <DemoPage
      pageId="echarts"
      focus={demo}
      lead={
        <>
          Apache ECharts renders declarative options to canvas with built-in animation,
          interaction and dozens of series types. Every chart here goes through one typed{' '}
          <code className="font-mono text-sm">&lt;EChart /&gt;</code> wrapper that
          registers only the modules each demo imports from{' '}
          <code className="font-mono text-sm">echarts/core</code>, resizes with its
          container, follows the app&apos;s dark mode and disposes on unmount.
        </>
      }
      toc={TOC}
      credits={CREDITS}
    >
      <LiveStreamDemo />
      <CandlestickDemo />
      <RealtimeRaceDemo />
      <NobelGraphDemo />
      <NobelSankeyDemo />
      <CalendarHeatmapDemo />
      <GaugesDemo />
      <HierarchyMorphDemo />
      <PokemonDemo />
      <EChartsBonusDemo />
    </DemoPage>
  )
}
