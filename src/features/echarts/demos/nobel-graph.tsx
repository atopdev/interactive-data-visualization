import { useQuery } from '@tanstack/react-query'
import {
  GraphChart,
  SankeyChart,
  type GraphSeriesOption,
  type SankeySeriesOption,
} from 'echarts/charts'
import {
  LegendComponent,
  TooltipComponent,
  type LegendComponentOption,
  type TooltipComponentOption,
} from 'echarts/components'
import { useMemo, useState } from 'react'
import { EChart } from '@/components/charts/echart'
import { SliderControl } from '@/components/page/control'
import { DataState } from '@/components/page/data-state'
import { DemoSection } from '@/components/page/demo-section'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { badgeFor } from '@/lib/badge'
import { echarts, type ComposeOption } from '@/lib/echarts'
import type { NobelData } from '@/lib/sources/nobel'
import { nobelQuery } from '../queries'

echarts.use([GraphChart, SankeyChart, TooltipComponent, LegendComponent])

type GraphOption = ComposeOption<
  GraphSeriesOption | TooltipComponentOption | LegendComponentOption
>
type SankeyOption = ComposeOption<SankeySeriesOption | TooltipComponentOption>

const CATEGORIES = [
  'Physics',
  'Chemistry',
  'Physiology or Medicine',
  'Literature',
  'Peace',
  'Economic Sciences',
]

function Graph({ data, count }: { data: NobelData; count: number }) {
  const theme = useChartTheme()
  const option = useMemo<GraphOption>(() => {
    const picked = data.laureates
      .filter((l) => l.country && l.prizes.length)
      .toSorted(
        (a, b) =>
          Math.max(...b.prizes.map((p) => p.year)) -
          Math.max(...a.prizes.map((p) => p.year)),
      )
      .slice(0, count)
    const countries = new Map<string, number>()
    for (const l of picked)
      countries.set(l.country ?? '', (countries.get(l.country ?? '') ?? 0) + 1)
    const nodes = [
      ...CATEGORIES.map((c, i) => ({
        id: `cat:${c}`,
        name: c,
        category: i,
        symbolSize: 34,
        label: { show: true },
      })),
      ...[...countries].map(([c, n]) => ({
        id: `country:${c}`,
        name: c,
        category: 6,
        symbolSize: 8 + Math.sqrt(n) * 5,
        label: { show: n >= 4 },
        value: n,
      })),
      ...picked.map((l) => ({
        id: `l:${l.id}`,
        name: `${l.name} (${Math.max(...l.prizes.map((p) => p.year))})`,
        category: Math.max(0, CATEGORIES.indexOf(l.prizes[0].category)),
        symbolSize: 7,
      })),
    ]
    const links = picked.flatMap((l) => [
      ...l.prizes.map((p) => ({
        source: `l:${l.id}`,
        target: `cat:${p.category}`,
      })),
      { source: `l:${l.id}`, target: `country:${l.country}` },
    ])
    return {
      tooltip: {
        formatter: (params) => {
          const p = Array.isArray(params) ? params[0] : params
          return p.dataType === 'edge' ? '' : p.name
        },
      },
      legend: {
        bottom: 0,
        data: [...CATEGORIES, 'Birth country'],
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { fontSize: 11 },
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          roam: true,
          draggable: true,
          data: nodes,
          links,
          categories: [
            ...CATEGORIES.map((name, i) => ({
              name,
              itemStyle: { color: theme.series[i] },
            })),
            { name: 'Birth country', itemStyle: { color: theme.muted } },
          ],
          force: {
            repulsion: 60,
            edgeLength: [30, 80],
            gravity: 0.08,
            friction: 0.15,
          },
          lineStyle: {
            color: theme.border,
            opacity: 0.8,
            width: 0.8,
            curveness: 0.1,
          },
          label: { position: 'right', fontSize: 11, color: theme.foreground },
          emphasis: {
            focus: 'adjacency',
            lineStyle: { width: 2, color: theme.accent },
          },
          blur: { itemStyle: { opacity: 0.1 }, lineStyle: { opacity: 0.05 } },
        },
      ],
    }
  }, [data, count, theme])
  return (
    <EChart
      option={option}
      className="h-[32rem]"
      ariaLabel="Force-directed graph of Nobel laureates, categories and countries"
    />
  )
}

export function NobelGraphDemo() {
  const query = useQuery(nobelQuery())
  const { source, reason } = badgeFor(query)
  const [count, setCount] = useState(150)
  return (
    <DemoSection
      id="graph"
      index={4}
      title="Force-layout graph"
      description="The same Nobel network as the D3 page, this time as a declarative ECharts graph series: layout 'force', roam and draggable nodes, category colors, and emphasis.focus = 'adjacency' to fade everything but a hovered node's neighbors. Compare the ergonomics with the hand-built D3 version."
      source={source}
      sourceReason={reason}
      sourceLabel="Nobel Prize API v2.1"
      controls={
        <SliderControl
          label="Laureates"
          value={count}
          min={40}
          max={400}
          step={20}
          onChange={setCount}
        />
      }
    >
      <DataState query={query} className="h-[32rem]">
        {(data) => <Graph data={data} count={count} />}
      </DataState>
    </DemoSection>
  )
}

function Sankey({ data }: { data: NobelData }) {
  const theme = useChartTheme()
  const option = useMemo<SankeyOption>(() => {
    const rows = data.laureates.flatMap((l) =>
      l.prizes.map((p) => ({
        era: p.year < 1950 ? '1901–1949' : p.year < 2000 ? '1950–1999' : '2000–today',
        category: p.category,
        gender:
          l.gender === 'org' ? 'Organization' : l.gender === 'female' ? 'Women' : 'Men',
      })),
    )
    const count = new Map<string, number>()
    const add = (a: string, b: string) =>
      count.set(`${a}→${b}`, (count.get(`${a}→${b}`) ?? 0) + 1)
    for (const r of rows) {
      add(r.era, r.category)
      add(r.category, r.gender)
    }
    const eras = ['1901–1949', '1950–1999', '2000–today']
    const genders = ['Men', 'Women', 'Organization']
    return {
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'sankey',
          left: 10,
          right: 110,
          top: 10,
          bottom: 10,
          nodeGap: 12,
          emphasis: { focus: 'adjacency' },
          data: [
            ...eras.map((name, i) => ({
              name,
              itemStyle: { color: theme.seq[i + 1] },
            })),
            ...CATEGORIES.map((name, i) => ({
              name,
              itemStyle: { color: theme.series[i] },
            })),
            ...genders.map((name) => ({
              name,
              itemStyle: { color: theme.muted },
            })),
          ],
          links: [...count].map(([k, value]) => {
            const [source, target] = k.split('→')
            return { source, target, value }
          }),
          lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.35 },
          label: { color: theme.foreground, fontSize: 12 },
        },
      ],
    }
  }, [data, theme])
  return (
    <EChart
      option={option}
      className="h-[28rem]"
      ariaLabel="Sankey diagram of Nobel prizes by era, category and gender"
    />
  )
}

export function NobelSankeyDemo() {
  const query = useQuery(nobelQuery())
  const { source, reason } = badgeFor(query)
  return (
    <DemoSection
      id="sankey"
      index={5}
      title="Sankey: era → category → gender"
      description="Every Nobel prize flowing from its era into its category and on to the laureate's gender (or organization). Links use a gradient between their end nodes; hovering focuses on adjacent flows, which makes the slow rise of women laureates in recent decades easy to trace."
      source={source}
      sourceReason={reason}
      sourceLabel="Nobel Prize API v2.1"
    >
      <DataState query={query} className="h-[28rem]">
        {(data) => <Sankey data={data} />}
      </DataState>
    </DemoSection>
  )
}
