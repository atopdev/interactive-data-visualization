import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { DemoPage, type TocEntry } from '@/components/page/demo-page'
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
