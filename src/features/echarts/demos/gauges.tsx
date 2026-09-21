import { useQuery } from '@tanstack/react-query'
import { GaugeChart, type GaugeSeriesOption } from 'echarts/charts'
import { useEffect, useMemo, useRef, useState } from 'react'
import { EChart } from '@/components/charts/echart'
import { DemoSection } from '@/components/page/demo-section'
import { Skeleton } from '@/components/ui/skeleton'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { useInView } from '@/hooks/use-in-view'
import { badgeFor } from '@/lib/badge'
import { fakeWith } from '@/lib/fake'
import { echarts, type ComposeOption } from '@/lib/echarts'
import { seededRandom } from '@/lib/random'
import { weatherNowQuery } from '../queries'

echarts.use([GaugeChart])

type Option = ComposeOption<GaugeSeriesOption>

interface GaugeSpec {
  name: string
  value: number
  min: number
  max: number
  unit: string
  color: string
  hint: string
}

const KPI_NAMES = fakeWith('echarts-kpis', (f) => ({
  product: f.commerce.productName(),
  team: f.company.name(),
}))
const rand = seededRandom('echarts-kpis')

function Gauge({ spec }: { spec: GaugeSpec }) {
  const theme = useChartTheme()
  const option = useMemo<Option>(
    () => ({
      series: [
        {
          type: 'gauge',
          min: spec.min,
          max: spec.max,
          startAngle: 210,
          endAngle: -30,
          radius: '64%',
          center: ['50%', '56%'],
          progress: {
            show: true,
            width: 12,
            roundCap: true,
            itemStyle: { color: spec.color },
          },
          axisLine: {
            roundCap: true,
            lineStyle: { width: 12, color: [[1, theme.grid]] },
          },
          pointer: {
            show: true,
            length: '58%',
            width: 4,
            itemStyle: { color: spec.color },
          },
          anchor: {
            show: true,
            size: 10,
            itemStyle: {
              color: theme.card,
              borderColor: spec.color,
              borderWidth: 3,
            },
          },
          axisTick: {
            distance: -20,
            length: 5,
            lineStyle: { color: theme.muted, width: 1 },
          },
          splitLine: {
            distance: -24,
            length: 10,
            lineStyle: { color: theme.muted, width: 1.5 },
          },
          // Labels sit outside the ring; the reduced radius leaves room so end values never clip.
          axisLabel: { distance: -14, color: theme.muted, fontSize: 9 },
          title: { offsetCenter: [0, '72%'], color: theme.muted, fontSize: 12 },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, '38%'],
            fontSize: 18,
            fontWeight: 600,
            color: theme.foreground,
            // A string template keeps the text element stable between updates, so
            // valueAnimation tweens from the previous value (a new formatter
            // function per render would restart the count from zero).
            formatter: `{value}${spec.unit}`,
          },
          animationDurationUpdate: 1200,
          animationEasingUpdate: 'cubicOut',
          // valueAnimation interpolates at the precision of the data value.
          data: [
            {
              value: Number(spec.value.toFixed(spec.unit === '%' ? 0 : 1)),
              name: spec.name,
            },
          ],
        },
      ],
    }),
    [spec, theme],
  )
  return (
    <figure className="flex flex-col items-center rounded-xl border bg-surface-2 p-2">
      <EChart
        option={option}
        className="h-52"
        ariaLabel={`${spec.name}: ${spec.value}${spec.unit}`}
      />
      <figcaption className="-mt-3 pb-2 text-center text-[11px] text-muted-foreground">
        {spec.hint}
      </figcaption>
    </figure>
  )
}

export function GaugesDemo() {
  const weather = useQuery(weatherNowQuery())
  const { source, reason } = badgeFor(weather)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const theme = useChartTheme()
  // Two generated KPIs drift every couple of seconds while visible.
  const [kpi, setKpi] = useState({ uptime: 99.4, conversion: 3.8 })
  useEffect(() => {
    if (!inView) return
    const id = window.setInterval(
      () =>
        setKpi((k) => ({
          uptime: Math.min(100, Math.max(97, k.uptime + (rand() - 0.5) * 0.6)),
          conversion: Math.min(
            8,
            Math.max(1, k.conversion + (rand() - 0.5) * 0.8),
          ),
        })),
      2200,
    )
    return () => window.clearInterval(id)
  }, [inView])

  const w = weather.data?.data
  const specs: GaugeSpec[] | null = w
    ? [
        {
          name: 'Temperature',
          value: w.temperature,
          min: -10,
          max: 40,
          unit: '°C',
          color: theme.series[1],
          hint: `${w.city} now · Open-Meteo`,
        },
        {
          name: 'Humidity',
          value: w.humidity,
          min: 0,
          max: 100,
          unit: '%',
          color: theme.series[0],
          hint: 'Relative humidity · Open-Meteo',
        },
        {
          name: 'Wind',
          value: w.windSpeed,
          min: 0,
          max: 60,
          unit: ' km/h',
          color: theme.series[2],
          hint: 'Wind at 10 m · Open-Meteo',
        },
        {
          name: 'Uptime',
          value: kpi.uptime,
          min: 95,
          max: 100,
          unit: '%',
          color: theme.series[5],
          hint: `${KPI_NAMES.team} API (generated)`,
        },
        {
          name: 'Conversion',
          value: kpi.conversion,
          min: 0,
          max: 10,
          unit: '%',
          color: theme.series[6],
          hint: `${KPI_NAMES.product} (generated)`,
        },
      ]
    : null

  return (
    <DemoSection
      id="gauges"
      index={7}
      title="Animated gauge dashboard"
      description="Gauge series with progress arcs, animated pointers and valueAnimation on the readout. The weather gauges refresh from Open-Meteo every minute; the two KPI gauges are generated values drifting every few seconds (only while visible), so the tweening is always on show."
      source={source}
      sourceReason={reason}
      sourceLabel="Open-Meteo + generated KPIs"
    >
      <div
        ref={ref}
        className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5"
      >
        {specs
          ? specs.map((s) => <Gauge key={s.name} spec={s} />)
          : Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
      </div>
    </DemoSection>
  )
}
