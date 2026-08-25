import {
  BarChart,
  LineChart,
  type BarSeriesOption,
  type LineSeriesOption,
} from 'echarts/charts'
import { GridComponent, type GridComponentOption } from 'echarts/components'
import { useEffect, useMemo, useState } from 'react'
import { EChart } from '@/components/charts/echart'
import { echarts, type ComposeOption } from '@/lib/echarts'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { seededRandom } from '@/lib/random'

echarts.use([LineChart, BarChart, GridComponent])

type Option = ComposeOption<LineSeriesOption | BarSeriesOption | GridComponentOption>

const rand = seededRandom('landing-echarts')
const initial = Array.from(
  { length: 24 },
  (_, i) => 40 + Math.sin(i / 3) * 18 + rand() * 12,
)

/** Mini streaming area chart: a new point every 900ms. */
export default function EChartsPreview() {
  const [values, setValues] = useState(initial)
  const theme = useChartTheme()
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => {
      setValues((prev) => {
        const last = prev[prev.length - 1]
        const next = Math.min(90, Math.max(10, last + (rand() - 0.5) * 16))
        return [...prev.slice(1), next]
      })
    }, 900)
    return () => window.clearInterval(id)
  }, [reduced])

  const option = useMemo<Option>(
    () => ({
      grid: { left: 0, right: 0, top: 10, bottom: 0 },
      xAxis: {
        type: 'category',
        show: false,
        boundaryGap: false,
        data: values.map((_, i) => i),
      },
      yAxis: { type: 'value', show: false, min: 0, max: 100 },
      animationDurationUpdate: 800,
      series: [
        {
          type: 'bar',
          data: values.map((v) => v * 0.45),
          barWidth: '55%',
          itemStyle: {
            color: theme.series[1],
            opacity: 0.35,
            borderRadius: [3, 3, 0, 0],
          },
        },
        {
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2.5, color: theme.accent },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: theme.accent },
              { offset: 1, color: 'transparent' },
            ]),
            opacity: 0.3,
          },
        },
      ],
    }),
    [values, theme],
  )

  return (
    <EChart option={option} className="h-full" ariaLabel="Streaming area chart preview" />
  )
}
