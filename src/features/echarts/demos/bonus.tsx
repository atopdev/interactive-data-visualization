import { useQuery } from '@tanstack/react-query'
import {
  EffectScatterChart,
  ThemeRiverChart,
  type EffectScatterSeriesOption,
  type ThemeRiverSeriesOption,
} from 'echarts/charts'
import {
  GeoComponent,
  LegendComponent,
  SingleAxisComponent,
  TooltipComponent,
  VisualMapComponent,
  type GeoComponentOption,
  type LegendComponentOption,
  type SingleAxisComponentOption,
  type TooltipComponentOption,
  type VisualMapComponentOption,
} from 'echarts/components'
import 'echarts-gl/lib/chart/bar3D'
import 'echarts-gl/lib/component/grid3D'
import type { FeatureCollection, Geometry, Position } from 'geojson'
import { useMemo } from 'react'
import { EChart } from '@/components/charts/echart'
import { DataState } from '@/components/page/data-state'
import { DemoSection } from '@/components/page/demo-section'
import { WebGLStage } from '@/components/webgl-stage'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { badgeFor } from '@/lib/badge'
import { alpha } from '@/lib/colors'
import { echarts, type ComposeOption, type EChartsCoreOption } from '@/lib/echarts'
import { countries, type CountryProps } from '@/lib/geo'
import type { NpmDownloads } from '@/lib/sources/npm'
import type { Quake } from '@/lib/sources/usgs'
import { npmDownloadsQuery, quakesQuery } from '../queries'

echarts.use([
  ThemeRiverChart,
  EffectScatterChart,
  SingleAxisComponent,
  GeoComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
])
/**
 * ECharts draws geo shapes in a planar lon/lat space, so rings crossing the
 * antimeridian (Russia, Fiji) would streak across the whole map. Shift their
 * western half by +360° so each ring stays contiguous; Antarctica is dropped.
 */
function planarWorld(): FeatureCollection<Geometry, CountryProps> {
  const fixRing = (ring: Position[]): Position[] => {
    const crosses = ring.some((p) => p[0] > 150) && ring.some((p) => p[0] < -150)
    return crosses ? ring.map(([x, y]) => [x < 0 ? x + 360 : x, y]) : ring
  }
  const fixGeometry = (g: Geometry): Geometry =>
    g.type === 'Polygon'
      ? { ...g, coordinates: g.coordinates.map(fixRing) }
      : g.type === 'MultiPolygon'
        ? { ...g, coordinates: g.coordinates.map((poly) => poly.map(fixRing)) }
        : g
  return {
    ...countries,
    features: countries.features
      .filter((f) => f.properties.name !== 'Antarctica')
      .map((f) => ({ ...f, geometry: fixGeometry(f.geometry) })),
  }
}

// Geo map from the bundled world-atlas shapes (no runtime fetch).
echarts.registerMap(
  'world-110m',
  planarWorld() as unknown as Parameters<typeof echarts.registerMap>[1],
)

type RiverOption = ComposeOption<
  | ThemeRiverSeriesOption
  | SingleAxisComponentOption
  | TooltipComponentOption
  | LegendComponentOption
>
type GeoOption = ComposeOption<
  | EffectScatterSeriesOption
  | GeoComponentOption
  | TooltipComponentOption
  | VisualMapComponentOption
>

function weekly(npm: NpmDownloads) {
  const rows: [string, number, string][] = []
  for (let i = 0; i + 7 <= npm.days.length; i += 7) {
    for (const p of npm.packages) {
      rows.push([
        npm.days[i],
        p.downloads.slice(i, i + 7).reduce((a, b) => a + b, 0),
        p.name,
      ])
    }
  }
  return rows
}

function monthly(npm: NpmDownloads) {
  const months = [...new Set(npm.days.map((d) => d.slice(0, 7)))].slice(-12)
  const values = npm.packages.flatMap((p, pi) =>
    months.map((m, mi) => {
      const sum = p.downloads.reduce(
        (s, v, i) => (npm.days[i].startsWith(m) ? s + v : s),
        0,
      )
      return [mi, pi, Math.round(sum / 1e6)]
    }),
  )
  return { months, values, names: npm.packages.map((p) => p.name) }
}

function River({ downloads }: { downloads: NpmDownloads }) {
  const theme = useChartTheme()
  const option = useMemo<RiverOption>(
    () => ({
      color: theme.series,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: theme.muted } },
      },
      legend: { top: 0, data: downloads.packages.map((p) => p.name) },
      singleAxis: {
        top: 40,
        bottom: 30,
        type: 'time',
        axisPointer: { animation: true, label: { show: true } },
        splitLine: { show: false },
      },
      series: [
        {
          type: 'themeRiver',
          data: weekly(downloads),
          label: { show: false },
          emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.3)' } },
        },
      ],
    }),
    [downloads, theme],
  )
  return (
    <EChart
      option={option}
      className="h-72"
      ariaLabel="Theme river of weekly npm downloads"
    />
  )
}

function QuakeMap({ points }: { points: Quake[] }) {
  const theme = useChartTheme()
  const option = useMemo<GeoOption>(() => {
    const strong = points.filter((q) => q.mag >= 2.5)
    return {
      tooltip: {
        formatter: (params) => {
          const p = Array.isArray(params) ? params[0] : params
          const [, , mag, place] = p.value as [number, number, number, string]
          return `<b>M ${mag.toFixed(1)}</b><br/>${place}`
        },
      },
      visualMap: {
        min: 2.5,
        max: Math.max(6, ...strong.map((q) => q.mag)),
        dimension: 2,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        itemHeight: 120,
        text: ['stronger', 'M2.5'],
        inRange: { color: [theme.series[3], theme.series[1], theme.series[7]] },
        textStyle: { color: theme.muted },
      },
      geo: {
        map: 'world-110m',
        roam: true,
        // All four sides set: the map fits inside the box keeping its aspect ratio.
        top: 10,
        bottom: 50,
        left: 10,
        right: 10,
        itemStyle: {
          areaColor: alpha(theme.muted, 0.15),
          borderColor: alpha(theme.muted, 0.4),
          borderWidth: 0.5,
        },
        emphasis: {
          itemStyle: { areaColor: alpha(theme.muted, 0.3) },
          label: { show: false },
        },
        silent: false,
      },
      series: [
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: strong.map((q) => [q.lon, q.lat, q.mag, q.place]),
          symbolSize: (v: number[]) => Math.max(4, (v[2] - 2) * 4),
          rippleEffect: { brushType: 'stroke', scale: 3.5, period: 3 },
          showEffectOn: 'render',
          zlevel: 1,
        },
      ],
    }
  }, [points, theme])
  return (
    <EChart
      option={option}
      className="h-[26rem]"
      ariaLabel="World map of this week's earthquakes above magnitude 2.5"
    />
  )
}

function Bars3D({ downloads }: { downloads: NpmDownloads }) {
  const theme = useChartTheme()
  // echarts-gl's option types are not published, so this option is untyped core config.
  const option = useMemo<EChartsCoreOption>(() => {
    const { months, values, names } = monthly(downloads)
    return {
      tooltip: {},
      visualMap: {
        max: Math.max(...values.map((v) => v[2])),
        inRange: { color: [theme.seq[0], theme.seq[1], theme.seq[2], theme.seq[3]] },
        show: false,
      },
      xAxis3D: {
        type: 'category',
        data: months.map((m) => m.slice(2)),
        name: '',
        axisLabel: { color: theme.muted },
      },
      yAxis3D: {
        type: 'category',
        data: names,
        name: '',
        axisLabel: { color: theme.muted },
      },
      zAxis3D: {
        type: 'value',
        name: 'M/month',
        nameTextStyle: { color: theme.muted },
        axisLabel: { color: theme.muted },
      },
      grid3D: {
        boxWidth: 200,
        boxDepth: 80,
        viewControl: {
          autoRotate: true,
          autoRotateSpeed: 6,
          distance: 230,
          alpha: 22,
          beta: 30,
        },
        light: { main: { intensity: 1.2, shadow: true }, ambient: { intensity: 0.4 } },
        axisLine: { lineStyle: { color: theme.muted } },
        splitLine: { lineStyle: { color: theme.grid } },
        axisPointer: { lineStyle: { color: theme.accent } },
      },
      series: [
        {
          type: 'bar3D',
          data: values.map((v) => ({ value: v })),
          shading: 'lambert',
          bevelSize: 0.3,
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              formatter: (p: { value: number[] }) => `${p.value[2]}M`,
            },
          },
        },
      ],
    }
  }, [downloads, theme])
  return (
    <EChart
      option={option}
      className="h-96"
      ariaLabel="3D bar chart of monthly npm downloads per library"
    />
  )
}

export function EChartsBonusDemo() {
  const npm = useQuery(npmDownloadsQuery())
  const quakes = useQuery(quakesQuery())
  const { source, reason } = badgeFor(npm, quakes)
  return (
    <DemoSection
      id="bonus"
      index={10}
      title="Bonus: themeRiver, geo effectScatter, echarts-gl 3D"
      description="A themeRiver of weekly npm downloads; this week's USGS earthquakes (M2.5+) as rippling effectScatter points on a roamable geo map registered from the bundled world-atlas shapes; and an auto-rotating echarts-gl bar3D of monthly downloads, rendered with WebGL only while it holds the page's single WebGL slot."
      source={source}
      sourceReason={reason}
      sourceLabel="npm registry + USGS"
    >
      <div className="flex flex-col gap-8">
        <DataState query={npm} className="h-72">
          {(d) => <River downloads={d} />}
        </DataState>
        <div className="grid gap-6 xl:grid-cols-2">
          <DataState
            query={quakes}
            isEmpty={(d) => d.quakes.length === 0}
            className="h-[26rem]"
          >
            {(d) => <QuakeMap points={d.quakes} />}
          </DataState>
          <DataState query={npm} className="h-96">
            {(d) => (
              <div className="relative h-96 overflow-hidden rounded-xl bg-surface-2">
                <WebGLStage id="echarts-gl-bar3d">
                  <Bars3D downloads={d} />
                </WebGLStage>
              </div>
            )}
          </DataState>
        </div>
      </div>
    </DemoSection>
  )
}
