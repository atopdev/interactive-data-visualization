import { useQuery } from '@tanstack/react-query'
import {
  ParallelChart,
  RadarChart,
  type ParallelSeriesOption,
  type RadarSeriesOption,
} from 'echarts/charts'
import {
  LegendComponent,
  ParallelComponent,
  RadarComponent,
  TooltipComponent,
  type LegendComponentOption,
  type ParallelComponentOption,
  type RadarComponentOption,
  type TooltipComponentOption,
} from 'echarts/components'
import { useMemo, useState } from 'react'
import { EChart } from '@/components/charts/echart'
import { DataInspector, type InspectorColumn } from '@/components/data-inspector'
import { DataState } from '@/components/page/data-state'
import { DemoSection } from '@/components/page/demo-section'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { badgeFor } from '@/lib/badge'
import { alpha } from '@/lib/colors'
import { echarts, type ComposeOption } from '@/lib/echarts'
import { STAT_KEYS, type Pokemon, type PokemonList } from '@/lib/sources/pokeapi'
import { pokemonQuery } from '../queries'

echarts.use([
  RadarChart,
  ParallelChart,
  RadarComponent,
  ParallelComponent,
  TooltipComponent,
  LegendComponent,
])

type Option = ComposeOption<
  | RadarSeriesOption
  | ParallelSeriesOption
  | RadarComponentOption
  | ParallelComponentOption
  | TooltipComponentOption
  | LegendComponentOption
>
type View = 'radar' | 'parallel'

const LABELS: Record<(typeof STAT_KEYS)[number], string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function Chart({
  list,
  selected,
  view,
}: {
  list: PokemonList
  selected: string[]
  view: View
}) {
  const theme = useChartTheme()
  const option = useMemo<Option>(() => {
    const colorOf = (name: string) =>
      theme.series[list.pokemon.findIndex((p) => p.name === name) % 8]
    const picked = list.pokemon.filter((p) => selected.includes(p.name))
    const max = Math.max(...list.pokemon.flatMap((p) => STAT_KEYS.map((k) => p.stats[k])))
    if (view === 'radar') {
      return {
        tooltip: {},
        legend: { bottom: 0, data: picked.map((p) => cap(p.name)) },
        radar: {
          indicator: STAT_KEYS.map((k) => ({
            name: LABELS[k],
            max: Math.ceil(max / 10) * 10,
          })),
          radius: '62%',
          splitNumber: 4,
        },
        series: [
          {
            type: 'radar',
            data: picked.map((p) => ({
              name: cap(p.name),
              value: STAT_KEYS.map((k) => p.stats[k]),
              lineStyle: { color: colorOf(p.name), width: 2 },
              itemStyle: { color: colorOf(p.name) },
              areaStyle: { color: alpha(colorOf(p.name), 0.18) },
              symbolSize: 5,
            })),
            emphasis: { lineStyle: { width: 3 }, areaStyle: { opacity: 0.4 } },
          },
        ],
      }
    }
    return {
      tooltip: {},
      parallelAxis: [
        ...STAT_KEYS.map((k, i) => ({
          dim: i,
          name: LABELS[k],
          max: Math.ceil(max / 10) * 10,
        })),
        { dim: STAT_KEYS.length, name: 'Total', max: 700 },
      ],
      parallel: {
        left: 40,
        right: 50,
        top: 40,
        bottom: 30,
        parallelAxisDefault: { nameTextStyle: { color: theme.muted } },
      },
      series: list.pokemon.map((p: Pokemon) => {
        const on = selected.includes(p.name)
        const total = STAT_KEYS.reduce((s, k) => s + p.stats[k], 0)
        return {
          type: 'parallel',
          name: cap(p.name),
          smooth: true,
          data: [[...STAT_KEYS.map((k) => p.stats[k]), total]],
          lineStyle: {
            color: on ? colorOf(p.name) : theme.muted,
            width: on ? 3 : 1,
            opacity: on ? 0.95 : 0.25,
          },
        }
      }),
    }
  }, [list, selected, view, theme])
  return (
    <EChart
      option={option}
      notMerge
      className="h-[26rem]"
      ariaLabel={`${view} chart comparing Pokémon base stats`}
    />
  )
}

const COLUMNS: InspectorColumn<Pokemon>[] = [
  { id: 'name', header: 'Pokémon', value: (p) => cap(p.name) },
  { id: 'types', header: 'Types', value: (p) => p.types.join(', ') },
  ...STAT_KEYS.map((k) => ({
    id: k,
    header: LABELS[k],
    value: (p: Pokemon) => p.stats[k],
    numeric: true,
  })),
]

export function PokemonDemo() {
  const query = useQuery(pokemonQuery())
  const { source, reason } = badgeFor(query)
  const [view, setView] = useState<View>('radar')
  const [selected, setSelected] = useState(['pikachu', 'charizard', 'snorlax'])
  const names = query.data?.data.pokemon.map((p) => p.name) ?? []
  return (
    <DemoSection
      id="pokemon"
      index={9}
      title="Radar and parallel coordinates: Pokémon stats"
      description="Base stats for ten Pokémon from PokeAPI. The radar compares a selection's shape; parallel coordinates show every Pokémon at once with the selection highlighted, which makes trade-offs (fast but fragile, bulky but slow) visible. Toggle names to compare."
      source={source}
      sourceReason={reason}
      sourceLabel="PokeAPI"
      controls={
        <>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={view}
            onValueChange={(v) => v && setView(v as View)}
          >
            <ToggleGroupItem value="radar">Radar</ToggleGroupItem>
            <ToggleGroupItem value="parallel">Parallel</ToggleGroupItem>
          </ToggleGroup>
          <div className="flex flex-wrap gap-1">
            {names.map((n, i) => (
              <Toggle
                key={n}
                size="sm"
                variant="outline"
                pressed={selected.includes(n)}
                onPressedChange={(on) =>
                  setSelected((prev) =>
                    on
                      ? [...prev, n].slice(-4)
                      : prev.length > 1
                        ? prev.filter((x) => x !== n)
                        : prev,
                  )
                }
                className="gap-1.5 px-2 text-xs"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: `var(--series-${(i % 8) + 1})` }}
                />
                {cap(n)}
              </Toggle>
            ))}
          </div>
          <DataInspector
            title="Pokémon base stats"
            description="PokeAPI v2 /pokemon/{name}."
            rows={query.data?.data.pokemon ?? []}
            columns={COLUMNS}
          />
        </>
      }
    >
      <DataState
        query={query}
        isEmpty={(d) => d.pokemon.length === 0}
        className="h-[26rem]"
      >
        {(list) => <Chart list={list} selected={selected} view={view} />}
      </DataState>
    </DemoSection>
  )
}
