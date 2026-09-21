import { useQuery } from '@tanstack/react-query'
import { HeatmapChart, type HeatmapSeriesOption } from 'echarts/charts'
import {
  CalendarComponent,
  TooltipComponent,
  VisualMapComponent,
  type CalendarComponentOption,
  type TooltipComponentOption,
  type VisualMapComponentOption,
} from 'echarts/components'
import { useMemo, useState } from 'react'
import { EChart } from '@/components/charts/echart'
import { DataState } from '@/components/page/data-state'
import { DemoSection } from '@/components/page/demo-section'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { useElementSize } from '@/hooks/use-element-size'
import { badgeFor } from '@/lib/badge'
import { echarts, type ComposeOption } from '@/lib/echarts'
import type { TemperatureYear } from '@/lib/sources/openmeteo'
import { temperatureYearQuery } from '../queries'
import { useRef } from 'react'

echarts.use([
  HeatmapChart,
  CalendarComponent,
  VisualMapComponent,
  TooltipComponent,
])

type Option = ComposeOption<
  | HeatmapSeriesOption
  | CalendarComponentOption
  | VisualMapComponentOption
  | TooltipComponentOption
>
type Measure = 'max' | 'min' | 'range'

function Calendar({
  data,
  measure,
}: {
  data: TemperatureYear
  measure: Measure
}) {
  const theme = useChartTheme()
  const wrap = useRef<HTMLDivElement>(null)
  const { width } = useElementSize(wrap)
  const option = useMemo<Option>(() => {
    const values = data.days.map(
      (d) =>
        [d.date, measure === 'range' ? d.max - d.min : d[measure]] as const,
    )
    const nums = values.map((v) => v[1])
    const lo = Math.floor(Math.min(...nums))
    const hi = Math.ceil(Math.max(...nums))
    // Wide screens show the year on one row; narrow screens stack it vertically.
    const vertical = width > 0 && width < 640
    return {
      tooltip: {
        formatter: (p) => {
          const item = Array.isArray(p) ? p[0] : p
          const [date, v] = item.value as [string, number]
          return `${date}<br/><b>${v.toFixed(1)}°C</b> ${measure === 'range' ? 'daily range' : measure === 'max' ? 'high' : 'low'}`
        },
      },
      visualMap: {
        min: lo,
        max: hi,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        itemWidth: 12,
        inRange: {
          color:
            measure === 'range'
              ? [theme.seq[0], theme.seq[1], theme.seq[2], theme.seq[3]]
              : [theme.div[0], theme.div[1], theme.div[2]],
        },
        textStyle: { color: theme.muted },
      },
      calendar: {
        range: String(data.year),
        orient: vertical ? 'vertical' : 'horizontal',
        top: 30,
        left: vertical ? 40 : 50,
        right: vertical ? 10 : 20,
        bottom: 60,
        cellSize: vertical ? ['auto', 14] : ['auto', 'auto'],
        dayLabel: { firstDay: 1, nameMap: 'en' },
        monthLabel: { nameMap: 'en' },
        yearLabel: { show: false },
      },
      series: [
        {
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data: values.map((v) => [v[0], v[1]]),
        },
      ],
    }
  }, [data, measure, theme, width])
  const vertical = width > 0 && width < 640
  return (
    <div ref={wrap}>
      <EChart
        option={option}
        notMerge
        style={{ height: vertical ? 900 : 260 }}
        ariaLabel={`Calendar heatmap of daily temperatures in ${data.city}, ${data.year}`}
      />
    </div>
  )
}

export function CalendarHeatmapDemo() {
  const query = useQuery(temperatureYearQuery())
  const { source, reason } = badgeFor(query)
  const [measure, setMeasure] = useState<Measure>('max')
  return (
    <DemoSection
      id="calendar"
      index={6}
      title="Calendar heatmap of daily temperatures"
      description="A full year of daily London temperatures from the Open-Meteo archive on a calendar coordinate system. Highs and lows use a diverging cool-to-warm scale; the daily range uses a sequential one. Drag the visualMap handles to filter days."
      source={source}
      sourceReason={reason}
      sourceLabel="Open-Meteo archive API"
      controls={
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={measure}
          onValueChange={(v) => v && setMeasure(v as Measure)}
        >
          <ToggleGroupItem value="max">Daily high</ToggleGroupItem>
          <ToggleGroupItem value="min">Daily low</ToggleGroupItem>
          <ToggleGroupItem value="range">Range</ToggleGroupItem>
        </ToggleGroup>
      }
    >
      <DataState
        query={query}
        isEmpty={(d) => d.days.length === 0}
        className="h-64"
      >
        {(data) => <Calendar data={data} measure={measure} />}
      </DataState>
    </DemoSection>
  )
}
