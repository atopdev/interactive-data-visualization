import { useQuery } from '@tanstack/react-query'
import { LineChart, type LineSeriesOption } from 'echarts/charts'
import {
  GridComponent,
  MarkLineComponent,
  TooltipComponent,
  type GridComponentOption,
  type MarkLineComponentOption,
  type TooltipComponentOption,
} from 'echarts/components'
import { Activity, Pause, Play } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { EChart } from '@/components/charts/echart'
import { DemoSection } from '@/components/page/demo-section'
import { Button } from '@/components/ui/button'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { useCoinbaseTicker, type Tick } from '@/hooks/use-coinbase-ticker'
import { useInView } from '@/hooks/use-in-view'
import { usePageVisible } from '@/hooks/use-page-visible'
import { alpha } from '@/lib/colors'
import { echarts, type ComposeOption, type EChartsInstance } from '@/lib/echarts'
import { candlesQuery } from '../queries'

echarts.use([LineChart, GridComponent, TooltipComponent, MarkLineComponent])

type Option = ComposeOption<
  | LineSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | MarkLineComponentOption
>

const MAX_POINTS = 500
const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

export function LiveStreamDemo() {
  const wrap = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsInstance | null>(null)
  const points = useRef<[number, number][]>([])
  const inView = useInView(wrap)
  const visible = usePageVisible()
  const [paused, setPaused] = useState(false)
  const [open, setOpen] = useState<number | null>(null)
  const theme = useChartTheme()
  const candles = useQuery(candlesQuery())
  const seed = candles.data?.data.candles.at(-1)?.close

  // Ticks arrive already batched per animation frame; push them straight
  // into the chart without a React render.
  const onFrame = useCallback((ticks: Tick[]) => {
    for (const t of ticks) points.current.push([t.time, t.price])
    // Session open = first price received (setState bails out once set).
    setOpen((o) => o ?? ticks[0].price)
    if (points.current.length > MAX_POINTS)
      points.current.splice(0, points.current.length - MAX_POINTS)
    chartRef.current?.setOption({ series: [{ id: 'price', data: points.current }] })
  }, [])

  const ticker = useCoinbaseTicker({
    enabled: inView && visible && !paused,
    seedPrice: seed,
    onFrame,
  })

  const option = useMemo<Option>(
    () => ({
      animation: false,
      grid: { left: 72, right: 16, top: 20, bottom: 28 },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (v) => (typeof v === 'number' ? usd.format(v) : String(v)),
      },
      xAxis: { type: 'time', splitLine: { show: false } },
      yAxis: {
        type: 'value',
        scale: true,
        // The live range is narrow, so show whole dollars rather than $84.3k.
        axisLabel: { formatter: (v: number) => `${Math.round(v).toLocaleString('en')}` },
      },
      series: [
        {
          id: 'price',
          type: 'line',
          showSymbol: false,
          // Data is pushed imperatively by onFrame; re-inits repopulate on the next frame.
          data: [],
          lineStyle: { width: 2, color: theme.accent },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: alpha(theme.accent, 0.35) },
              { offset: 1, color: alpha(theme.accent, 0) },
            ]),
          },
          markLine: {
            symbol: 'none',
            silent: true,
            lineStyle: { color: theme.muted, type: 'dashed' },
            label: {
              formatter: 'session open',
              color: theme.muted,
              position: 'insideStartTop',
            },
            data: open ? [{ yAxis: open }] : [],
          },
        },
      ],
    }),
    [theme, open],
  )

  const change = ticker.price && open ? ((ticker.price - open) / open) * 100 : 0
  const up =
    ticker.previous === null || ticker.price === null || ticker.price >= ticker.previous

  return (
    <DemoSection
      id="live"
      index={1}
      title="Live BTC-USD stream"
      description="Trades from the Coinbase Exchange ticker channel over a WebSocket. Messages are buffered and flushed once per animation frame straight into setOption (no React re-render per tick), the socket reconnects with backoff, falls back to a simulated random walk if it cannot connect, and closes whenever the chart scrolls out of view or the tab is hidden."
      source={
        ticker.status === 'simulated'
          ? 'generated'
          : ticker.status === 'live'
            ? 'live'
            : 'loading'
      }
      sourceLabel={
        ticker.status === 'simulated' ? 'Simulated fallback stream' : 'Coinbase WebSocket'
      }
      reveal
      controls={
        <>
          <Button size="sm" variant="outline" onClick={() => setPaused((p) => !p)}>
            {paused ? <Play /> : <Pause />} {paused ? 'Resume' : 'Pause'}
          </Button>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="size-3.5" />
            {ticker.status === 'idle'
              ? 'socket closed (paused or off-screen)'
              : ticker.status}
            {' · '}
            {ticker.ticks.toLocaleString('en')} ticks
          </span>
        </>
      }
    >
      <div ref={wrap} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p
            className={`text-3xl font-semibold tracking-tight tabular-nums ${up ? 'text-emerald-500' : 'text-red-500'}`}
          >
            {ticker.price ? usd.format(ticker.price) : seed ? usd.format(seed) : '—'}
          </p>
          <p
            className={`text-sm tabular-nums ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
          >
            {change >= 0 ? '+' : ''}
            {change.toFixed(3)}% this session
          </p>
        </div>
        <EChart
          option={option}
          className="h-80"
          ariaLabel="Live Bitcoin price line chart"
          onReady={(chart) => {
            chartRef.current = chart
          }}
        />
      </div>
    </DemoSection>
  )
}
