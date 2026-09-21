import { useQuery } from '@tanstack/react-query'
import { BarChart, type BarSeriesOption } from 'echarts/charts'
import {
  GraphicComponent,
  GridComponent,
  type GraphicComponentOption,
  type GridComponentOption,
} from 'echarts/components'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { EChart } from '@/components/charts/echart'
import { DataInspector, type InspectorColumn } from '@/components/data-inspector'
import { DataState } from '@/components/page/data-state'
import { DemoSection } from '@/components/page/demo-section'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { useInView } from '@/hooks/use-in-view'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { badgeFor } from '@/lib/badge'
import { echarts, type ComposeOption } from '@/lib/echarts'
import type { WorldBankData } from '@/lib/sources/worldbank'
import { worldBankQuery } from '../queries'

echarts.use([BarChart, GridComponent, GraphicComponent])

type Option = ComposeOption<
  BarSeriesOption | GridComponentOption | GraphicComponentOption
>
type Metric = 'population' | 'gdpPerCapita'
const TOP = 12

const REGION_ORDER = [
  'East Asia & Pacific',
  'South Asia',
  'Europe & Central Asia',
  'Sub-Saharan Africa',
  'Latin America & Caribbean',
  'Middle East, North Africa, Afghanistan & Pakistan',
  'North America',
]

function Race({
  data,
  yearIndex,
  metric,
}: {
  data: WorldBankData
  yearIndex: number
  metric: Metric
}) {
  const theme = useChartTheme()
  const reduced = usePrefersReducedMotion()
  const option = useMemo<Option>(() => {
    const colorOf = (region: string) =>
      theme.series[Math.max(0, REGION_ORDER.indexOf(region)) % 8]
    const rows = data.countries
      .map((c) => ({
        name: c.name,
        region: c.region,
        value: c[metric][yearIndex],
      }))
      .filter(
        (r): r is { name: string; region: string; value: number } => r.value !== null,
      )
    const fmt = (v: number) =>
      metric === 'population'
        ? v >= 1e9
          ? `${(v / 1e9).toFixed(2)}B`
          : `${(v / 1e6).toFixed(1)}M`
        : `$${Math.round(v).toLocaleString('en')}`
    return {
      grid: { left: 150, right: 90, top: 10, bottom: 20 },
      xAxis: {
        type: 'value',
        max: 'dataMax',
        splitNumber: 4,
        axisLabel: { formatter: (v: number) => fmt(v), showMaxLabel: false },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        max: TOP - 1,
        data: rows.map((r) => r.name),
        axisLabel: { width: 140, overflow: 'truncate', fontSize: 12 },
        // realtimeSort re-orders the category axis every update.
        animationDuration: 300,
        animationDurationUpdate: 300,
      },
      series: [
        {
          type: 'bar',
          realtimeSort: true,
          data: rows.map((r) => ({
            value: r.value,
            itemStyle: { color: colorOf(r.region), borderRadius: [0, 4, 4, 0] },
          })),
          label: {
            show: true,
            position: 'right',
            valueAnimation: true,
            formatter: (p: { value: unknown }) => fmt(Number(p.value)),
            color: theme.foreground,
          },
        },
      ],
      animationDuration: 0,
      animationDurationUpdate: reduced ? 0 : 900,
      animationEasing: 'linear',
      animationEasingUpdate: 'linear',
      graphic: {
        elements: [
          {
            type: 'text',
            right: 100,
            bottom: 40,
            style: {
              text: String(data.years[yearIndex]),
              font: 'bolder 72px sans-serif',
              fill: theme.muted,
              opacity: 0.35,
            },
            z: 100,
          },
        ],
      },
    }
  }, [data, yearIndex, metric, theme, reduced])
  return (
    <EChart
      option={option}
      className="h-[26rem]"
      ariaLabel="Racing bar chart of countries by World Bank indicator"
    />
  )
}

export function RealtimeRaceDemo() {
  const query = useQuery(worldBankQuery())
  const { source, reason } = badgeFor(query)
  const [metric, setMetric] = useState<Metric>('population')
  const [yearIndex, setYearIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const years = query.data?.data.years.length ?? 0

  useEffect(() => {
    if (!playing || !inView || years === 0) return
    const id = window.setInterval(() => setYearIndex((i) => (i + 1) % years), 1000)
    return () => window.clearInterval(id)
  }, [playing, inView, years])

  const wb = query.data?.data
  const rows = useMemo(
    () =>
      wb
        ? wb.countries.map((c) => ({
            name: c.name,
            region: c.region,
            pop: c.population[yearIndex],
            gdp: c.gdpPerCapita[yearIndex],
          }))
        : [],
    [wb, yearIndex],
  )
  const columns: InspectorColumn<(typeof rows)[number]>[] = [
    { id: 'name', header: 'Country', value: (r) => r.name },
    { id: 'region', header: 'Region', value: (r) => r.region },
    { id: 'pop', header: 'Population', value: (r) => r.pop, numeric: true },
    {
      id: 'gdp',
      header: 'GDP per capita (US$)',
      value: (r) => r.gdp,
      numeric: true,
    },
  ]

  return (
    <DemoSection
      id="race"
      index={3}
      title="Bar chart race with realtimeSort"
      description="ECharts re-sorts the category axis on every update when realtimeSort is on, while labels use valueAnimation to count between values. One setOption per second drives the race through World Bank data from 2000 to 2023, colored by region. It pauses while off-screen."
      source={source}
      sourceReason={reason}
      sourceLabel="World Bank Indicators API"
      controls={
        <>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={metric}
            onValueChange={(v) => v && setMetric(v as Metric)}
          >
            <ToggleGroupItem value="population">Population</ToggleGroupItem>
            <ToggleGroupItem value="gdpPerCapita">GDP per capita</ToggleGroupItem>
          </ToggleGroup>
          <Button size="sm" onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause /> : <Play />} {playing ? 'Pause' : 'Play'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setYearIndex(0)}>
            <RotateCcw /> Restart
          </Button>
          <DataInspector
            title={`World Bank indicators, ${wb?.years[yearIndex] ?? ''}`}
            description="SP.POP.TOTL and NY.GDP.PCAP.CD for every country."
            rows={rows}
            columns={columns}
          />
        </>
      }
    >
      <div ref={ref}>
        <DataState
          query={query}
          isEmpty={(d) => d.countries.length === 0}
          className="h-[26rem]"
        >
          {(data) => (
            <Race data={data} yearIndex={yearIndex % data.years.length} metric={metric} />
          )}
        </DataState>
      </div>
    </DemoSection>
  )
}
