import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  CandlestickChart,
  LineChart,
  type BarSeriesOption,
  type CandlestickSeriesOption,
  type LineSeriesOption,
} from 'echarts/charts'
import {
  AxisPointerComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  type DataZoomComponentOption,
  type GridComponentOption,
  type LegendComponentOption,
  type TooltipComponentOption,
} from 'echarts/components'
import { useMemo } from 'react'
import { EChart } from '@/components/charts/echart'
import { DataInspector, type InspectorColumn } from '@/components/data-inspector'
import { DataState } from '@/components/page/data-state'
import { DemoSection } from '@/components/page/demo-section'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { badgeFor } from '@/lib/badge'
import { alpha } from '@/lib/colors'
import { echarts, type ComposeOption } from '@/lib/echarts'
import type { Candle, CandleSet } from '@/lib/sources/crypto'
import { candlesQuery } from '../queries'

echarts.use([
  CandlestickChart,
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
  AxisPointerComponent,
])

type Option = ComposeOption<
  | CandlestickSeriesOption
  | BarSeriesOption
  | LineSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | DataZoomComponentOption
  | LegendComponentOption
>

function movingAverage(candles: Candle[], n: number): (number | '-')[] {
  return candles.map((_, i) => {
    if (i < n - 1) return '-'
    let sum = 0
    for (let j = i - n + 1; j <= i; j++) sum += candles[j].close
    return Math.round((sum / n) * 100) / 100
  })
}

function Candles({ set }: { set: CandleSet }) {
  const theme = useChartTheme()
  const option = useMemo<Option>(() => {
    const c = set.candles
    const dates = c.map((d) => new Date(d.time).toISOString().slice(0, 10))
    const upColor = theme.series[2]
    const downColor = theme.series[7]
    return {
      legend: { top: 0, data: ['Candles', 'MA 7', 'MA 30'] },
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      axisPointer: { link: [{ xAxisIndex: 'all' }] },
      grid: [
        { left: 60, right: 16, top: 36, height: '58%' },
        { left: 60, right: 16, top: '76%', height: '14%' },
      ],
      xAxis: [
        {
          type: 'category',
          data: dates,
          boundaryGap: true,
          axisLine: { onZero: false },
          splitLine: { show: false },
        },
        {
          type: 'category',
          gridIndex: 1,
          data: dates,
          boundaryGap: true,
          axisLabel: { show: false },
          axisTick: { show: false },
        },
      ],
      yAxis: [
        {
          scale: true,
          axisLabel: { formatter: (v: number) => `$${(v / 1000).toFixed(0)}k` },
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          splitLine: { show: false },
        },
      ],
      dataZoom: [
        { type: 'inside', xAxisIndex: [0, 1], start: 55, end: 100 },
        {
          type: 'slider',
          xAxisIndex: [0, 1],
          bottom: 4,
          height: 18,
          start: 55,
          end: 100,
        },
      ],
      series: [
        {
          name: 'Candles',
          type: 'candlestick',
          // ECharts order: [open, close, low, high].
          data: c.map((d) => [d.open, d.close, d.low, d.high]),
          itemStyle: {
            color: upColor,
            color0: downColor,
            borderColor: upColor,
            borderColor0: downColor,
          },
        },
        {
          name: 'MA 7',
          type: 'line',
          data: movingAverage(c, 7),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: theme.series[0] },
        },
        {
          name: 'MA 30',
          type: 'line',
          data: movingAverage(c, 30),
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: theme.series[3] },
        },
        {
          name: 'Volume',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: c.map((d) => ({
            value: d.volume,
            itemStyle: { color: alpha(d.close >= d.open ? upColor : downColor, 0.6) },
          })),
        },
      ],
    }
  }, [set, theme])
  return (
    <EChart
      option={option}
      className="h-[28rem]"
      ariaLabel={`Daily ${set.product} candlestick chart with volume`}
    />
  )
}

const COLUMNS: InspectorColumn<Candle>[] = [
  {
    id: 'date',
    header: 'Date',
    value: (c) => new Date(c.time).toISOString().slice(0, 10),
  },
  { id: 'open', header: 'Open', value: (c) => c.open, numeric: true },
  { id: 'high', header: 'High', value: (c) => c.high, numeric: true },
  { id: 'low', header: 'Low', value: (c) => c.low, numeric: true },
  { id: 'close', header: 'Close', value: (c) => c.close, numeric: true },
  { id: 'volume', header: 'Volume', value: (c) => c.volume, numeric: true },
]

export function CandlestickDemo() {
  const query = useQuery(candlesQuery())
  const { source, reason } = badgeFor(query)
  const provider =
    query.data?.data.provider === 'binance'
      ? 'Binance public mirror'
      : 'Coinbase Exchange'
  return (
    <DemoSection
      id="candles"
      index={2}
      title="Candlestick + volume with dataZoom"
      description="Daily BTC candles from Coinbase (falling back to the Binance public data mirror) with 7- and 30-day moving averages and a linked volume grid. The inside and slider dataZoom components drive both grids; drag, scroll or pinch to zoom."
      source={source}
      sourceReason={reason}
      sourceLabel={provider}
      controls={
        <DataInspector
          title="Daily candles"
          description={`${provider}, most recent first when sorted by date.`}
          rows={query.data?.data.candles ?? []}
          columns={COLUMNS}
        />
      }
    >
      <DataState
        query={query}
        isEmpty={(d) => d.candles.length === 0}
        className="h-[28rem]"
      >
        {(set) => <Candles set={set} />}
      </DataState>
    </DemoSection>
  )
}
