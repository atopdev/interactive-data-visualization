import { useQuery } from '@tanstack/react-query'
import {
  SunburstChart,
  TreemapChart,
  type SunburstSeriesOption,
  type TreemapSeriesOption,
} from 'echarts/charts'
import { TooltipComponent, type TooltipComponentOption } from 'echarts/components'
import { UniversalTransition } from 'echarts/features'
import { Shuffle } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { EChart } from '@/components/charts/echart'
import { DataState } from '@/components/page/data-state'
import { DemoSection } from '@/components/page/demo-section'
import { Button } from '@/components/ui/button'
import { SwitchControl } from '@/components/page/control'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { useInView } from '@/hooks/use-in-view'
import { badgeFor } from '@/lib/badge'
import { echarts, type ComposeOption } from '@/lib/echarts'
import type { WorldBankData } from '@/lib/sources/worldbank'
import { worldBankQuery } from '../queries'

echarts.use([TreemapChart, SunburstChart, TooltipComponent, UniversalTransition])

type Option = ComposeOption<
  TreemapSeriesOption | SunburstSeriesOption | TooltipComponentOption
>
type Shape = 'treemap' | 'sunburst'

interface Node {
  name: string
  value: number
  children?: Node[]
  itemStyle?: { color: string }
}

function buildTree(data: WorldBankData, colors: string[]): Node[] {
  const last = data.years.length - 1
  const byRegion = new Map<string, Node[]>()
  for (const c of data.countries) {
    const v = c.population[last] ?? c.population.findLast((x) => x !== null) ?? null
    if (!v) continue
    const list = byRegion.get(c.region) ?? []
    list.push({ name: c.name, value: v })
    byRegion.set(c.region, list)
  }
  return [...byRegion]
    .map(([region, list], i) => {
      const sorted = list.sort((a, b) => b.value - a.value)
      // Keep the chart legible: top 10 countries plus an "Other" bucket.
      const top = sorted.slice(0, 10)
      const rest = sorted.slice(10).reduce((s, n) => s + n.value, 0)
      const children = rest ? [...top, { name: `Other ${region}`, value: rest }] : top
      return {
        name: region,
        value: children.reduce((s, n) => s + n.value, 0),
        children,
        itemStyle: { color: colors[i % colors.length] },
      }
    })
    .sort((a, b) => b.value - a.value)
}

const fmt = (v: number) =>
  v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : `${(v / 1e6).toFixed(1)}M`

function Morph({ data, shape }: { data: WorldBankData; shape: Shape }) {
  const theme = useChartTheme()
  const tree = useMemo(() => buildTree(data, theme.series), [data, theme])
  const option = useMemo<Option>(() => {
    const common = {
      id: 'population',
      data: tree,
      // Shared id + universalTransition lets ECharts morph between series types.
      universalTransition: { enabled: true, seriesKey: 'population' },
      animationDurationUpdate: 900,
    }
    const tooltip: TooltipComponentOption = {
      formatter: (params) => {
        const p = Array.isArray(params) ? params[0] : params
        return `${p.name}<br/><b>${fmt(Number(p.value))}</b>`
      },
    }
    return shape === 'treemap'
      ? {
          tooltip,
          series: [
            {
              ...common,
              type: 'treemap',
              roam: false,
              nodeClick: false,
              breadcrumb: { show: false },
              width: '100%',
              height: '100%',
              label: {
                show: true,
                formatter: '{b}',
                color: '#fff',
                fontSize: 11,
              },
              upperLabel: {
                show: true,
                height: 22,
                color: '#fff',
                fontWeight: 600,
              },
              itemStyle: {
                borderColor: theme.card,
                borderWidth: 1,
                gapWidth: 1,
              },
              levels: [
                {
                  itemStyle: {
                    borderColor: theme.card,
                    borderWidth: 3,
                    gapWidth: 3,
                  },
                },
                {
                  colorSaturation: [0.35, 0.6],
                  itemStyle: { gapWidth: 1, borderColorSaturation: 0.6 },
                },
              ],
            },
          ],
        }
      : {
          tooltip,
          series: [
            {
              ...common,
              type: 'sunburst',
              radius: ['12%', '95%'],
              sort: undefined,
              itemStyle: { borderColor: theme.card, borderWidth: 1 },
              label: {
                rotate: 'radial',
                fontSize: 10,
                color: '#fff',
                minAngle: 6,
              },
              levels: [
                {},
                {
                  r0: '12%',
                  r: '42%',
                  label: {
                    rotate: 'tangential',
                    fontSize: 11,
                    fontWeight: 600,
                  },
                },
                { r0: '42%', r: '95%', label: { align: 'right' } },
              ],
            },
          ],
        }
  }, [tree, shape, theme])
  return (
    <EChart
      option={option}
      notMerge={false}
      replaceMerge={['series']}
      className="h-[30rem]"
      ariaLabel={`${shape} of world population by World Bank region`}
    />
  )
}

export function HierarchyMorphDemo() {
  const query = useQuery(worldBankQuery())
  const { source, reason } = badgeFor(query)
  const [shape, setShape] = useState<Shape>('treemap')
  const [auto, setAuto] = useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)

  useEffect(() => {
    if (!auto || !inView) return
    const id = window.setInterval(
      () => setShape((s) => (s === 'treemap' ? 'sunburst' : 'treemap')),
      3500,
    )
    return () => window.clearInterval(id)
  }, [auto, inView])

  return (
    <DemoSection
      id="morph"
      index={8}
      title="Treemap ↔ sunburst morph"
      description="World population by World Bank region and country, switching between a treemap and a sunburst. Both series share an id, and universalTransition animates every rectangle into its arc (and back) instead of redrawing, which keeps each region trackable across the change."
      source={source}
      sourceReason={reason}
      sourceLabel="World Bank Indicators API"
      controls={
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShape((s) => (s === 'treemap' ? 'sunburst' : 'treemap'))}
          >
            <Shuffle /> Morph to {shape === 'treemap' ? 'sunburst' : 'treemap'}
          </Button>
          <SwitchControl label="Auto-morph" checked={auto} onChange={setAuto} />
        </>
      }
    >
      <div ref={ref}>
        <DataState query={query} className="h-[30rem]">
          {(data) => <Morph data={data} shape={shape} />}
        </DataState>
      </div>
    </DemoSection>
  )
}
