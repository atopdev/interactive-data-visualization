import { useQuery } from '@tanstack/react-query'
import * as d3 from 'd3'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DataInspector,
  type InspectorColumn,
} from '@/components/data-inspector'
import { DataState } from '@/components/page/data-state'
import { DemoSection } from '@/components/page/demo-section'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useElementSize } from '@/hooks/use-element-size'
import { useInView } from '@/hooks/use-in-view'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { badgeFor } from '@/lib/badge'
import type { OwidSlug, OwidTable } from '@/lib/sources/owid'
import { owidQuery } from '../queries'

const TOP = 12
const BAR = 30
const MARGIN = { top: 24, right: 64, bottom: 10, left: 10 }

type RaceSlug = Extract<OwidSlug, 'life-expectancy' | 'population'>

const fmt = (slug: OwidSlug) =>
  slug === 'population' ? d3.format('.3~s') : (v: number) => v.toFixed(1)

function Race({
  table,
  year,
  playing,
}: {
  table: OwidTable
  year: number
  playing: boolean
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const { width } = useElementSize(wrap)
  const reduced = usePrefersReducedMotion()
  const height = MARGIN.top + TOP * BAR + MARGIN.bottom
  // Stable color per country, assigned from the palette by first appearance.
  const colorOf = useMemo(() => {
    const scale = d3.scaleOrdinal<string, string>(
      Array.from({ length: 8 }, (_, i) => `var(--series-${i + 1})`),
    )
    return (code: string) => scale(code)
  }, [])

  useEffect(() => {
    const el = svgRef.current
    if (!el || width === 0) return
    const svg = d3.select(el)
    if (svg.select('g.bars').empty()) {
      svg.append('g').attr('class', 'axis')
      svg.append('g').attr('class', 'bars')
      svg.append('g').attr('class', 'labels')
      svg
        .append('text')
        .attr('class', 'year')
        .attr('text-anchor', 'end')
        .attr('font-weight', 700)
        .attr('fill', 'var(--muted-foreground)')
        .attr('opacity', 0.35)
    }
    const yi = table.years.indexOf(year)
    const ranked = table.series
      .map((s) => ({
        entity: s.entity,
        code: s.code,
        value: s.values[yi] ?? NaN,
      }))
      .filter((d) => Number.isFinite(d.value))
      .sort((a, b) => b.value - a.value)
      .slice(0, TOP)

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(ranked, (d) => d.value) ?? 1])
      .range([MARGIN.left, width - MARGIN.right])
    const y = (i: number) => MARGIN.top + i * BAR
    const duration = reduced ? 0 : playing ? 700 : 350
    const t = d3.transition().duration(duration).ease(d3.easeLinear)
    const format = fmt(table.slug)

    svg
      .select<SVGGElement>('g.axis')
      .attr('transform', `translate(0,${MARGIN.top})`)
      // d3-axis draws with currentColor, so coloring the group themes new ticks too.
      .attr('color', 'var(--muted-foreground)')
      .call((g) => {
        g.transition(t).call(
          d3
            .axisTop(x)
            .ticks(width / 120)
            .tickSize(-TOP * BAR)
            .tickFormat((v) => format(Number(v))),
        )
        g.select('.domain').remove()
        g.selectAll('.tick line').attr('stroke-opacity', 0.15)
      })

    svg
      .select('g.bars')
      .selectAll<SVGRectElement, (typeof ranked)[number]>('rect')
      .data(ranked, (d) => d.code)
      .join(
        (enter) =>
          enter
            .append('rect')
            .attr('x', x(0))
            .attr('y', y(TOP))
            .attr('height', BAR - 6)
            .attr('rx', 4)
            .attr('width', 0)
            .attr('fill', (d) => colorOf(d.code)),
        (update) => update,
        (exit) =>
          exit.transition(t).attr('y', y(TOP)).attr('width', 0).remove(),
      )
      .transition(t)
      .attr('y', (_, i) => y(i) + 3)
      .attr('width', (d) => Math.max(0, x(d.value) - x(0)))

    // Country name inside the bar's end, value just outside it. Names that
    // would not fit inside a short bar move outside, in front of the value.
    const fits = (d: (typeof ranked)[number]) =>
      x(d.value) - x(0) > d.entity.length * 7.2 + 16
    const labels = (cls: 'name' | 'value') =>
      svg
        .select('g.labels')
        .selectAll<SVGTextElement, (typeof ranked)[number]>(`text.${cls}`)
        .data(ranked, (d) => d.code)
        .join(
          (enter) =>
            enter
              .append('text')
              .attr('class', cls)
              .attr('y', y(TOP))
              .attr('x', x(0))
              .attr('dy', BAR / 2 + 4)
              .attr('font-size', 12)
              .attr('font-weight', cls === 'name' ? 600 : 400)
              .attr('text-anchor', cls === 'name' ? 'end' : 'start')
              .attr(
                'fill',
                cls === 'name' ? 'white' : 'var(--muted-foreground)',
              ),
          (update) => update,
          (exit) =>
            exit.transition(t).attr('y', y(TOP)).attr('opacity', 0).remove(),
        )
        .text((d) =>
          cls === 'name'
            ? d.entity
            : fits(d)
              ? format(d.value)
              : `${d.entity}  ${format(d.value)}`,
        )
        .transition(t)
        .attr('y', (_, i) => y(i))
        .attr('x', (d) => (cls === 'name' ? x(d.value) - 8 : x(d.value) + 6))
        .attr('opacity', (d) => (cls === 'name' && !fits(d) ? 0 : 1))
    labels('name')
    labels('value')

    svg
      .select('text.year')
      .attr('x', width - 12)
      .attr('y', height - 16)
      .attr('font-size', Math.min(96, width / 7))
      .text(year)
  }, [table, year, width, height, playing, reduced, colorOf])

  useEffect(() => {
    const el = svgRef.current
    return () => {
      if (el) d3.select(el).selectAll('*').interrupt()
    }
  }, [])

  return (
    <div ref={wrap}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full"
        role="img"
        aria-label={`Top ${TOP} countries by ${table.label} in ${year}`}
      />
    </div>
  )
}

export function BarRaceDemo() {
  const [slug, setSlug] = useState<RaceSlug>('population')
  const query = useQuery(owidQuery(slug))
  const { source, reason } = badgeFor(query)
  const years = query.data?.data.years ?? []
  const [yearIndex, setYearIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const reduced = usePrefersReducedMotion()
  const index = Math.min(yearIndex, Math.max(0, years.length - 1))
  const year = years[index] ?? 0

  // Advance one year per tick while playing and visible (paused off-screen).
  useEffect(() => {
    if (!playing || !inView || years.length === 0) return
    const id = window.setInterval(
      () => setYearIndex((i) => (i + 1 >= years.length ? 0 : i + 1)),
      reduced ? 1200 : 750,
    )
    return () => window.clearInterval(id)
  }, [playing, inView, years.length, reduced])

  const queryData = query.data
  const rows = useMemo(() => {
    const t = queryData?.data
    if (!t) return []
    const yi = t.years.indexOf(year)
    return t.series.map((s) => ({
      entity: s.entity,
      code: s.code,
      value: s.values[yi],
    }))
  }, [queryData, year])
  const columns: InspectorColumn<(typeof rows)[number]>[] = [
    { id: 'entity', header: 'Country', value: (r) => r.entity },
    { id: 'code', header: 'ISO', value: (r) => r.code },
    {
      id: 'value',
      header: `${query.data?.data.label ?? ''} (${year})`,
      value: (r) => r.value,
      numeric: true,
    },
  ]

  return (
    <DemoSection
      id="bar-race"
      index={3}
      title="Bar chart race"
      description="Each tick ranks countries for the next year and D3's keyed data join handles the rest: bars that stay slide to their new rank, newcomers enter from below, dropouts exit. Colors follow each country, not its rank. Pauses automatically when scrolled out of view."
      source={source}
      sourceReason={reason}
      sourceLabel="Our World in Data"
      controls={
        <>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={slug}
            onValueChange={(v) => {
              if (!v) return
              setSlug(v as RaceSlug)
              setYearIndex(0)
            }}
          >
            <ToggleGroupItem value="life-expectancy">
              Life expectancy
            </ToggleGroupItem>
            <ToggleGroupItem value="population">Population</ToggleGroupItem>
          </ToggleGroup>
          <Button size="sm" onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause /> : <Play />} {playing ? 'Pause' : 'Play'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setYearIndex(0)}>
            <RotateCcw /> Restart
          </Button>
          <DataInspector
            title={`${query.data?.data.label ?? 'Data'} in ${year}`}
            description="Every country in the dataset for the year currently shown."
            rows={rows}
            columns={columns}
          />
        </>
      }
    >
      <div ref={ref} className="flex flex-col gap-4">
        <DataState
          query={query}
          isEmpty={(d) => d.series.length === 0}
          className="h-96"
        >
          {(table) => <Race table={table} year={year} playing={playing} />}
        </DataState>
        <div className="flex items-center gap-3">
          <span className="w-10 font-mono text-xs text-muted-foreground tabular-nums">
            {years[0]}
          </span>
          <Slider
            value={[index]}
            min={0}
            max={Math.max(0, years.length - 1)}
            step={1}
            onValueChange={([v]) => {
              setPlaying(false)
              setYearIndex(v)
            }}
            aria-label="Scrub year"
          />
          <span className="w-10 font-mono text-xs text-muted-foreground tabular-nums">
            {years.at(-1)}
          </span>
        </div>
      </div>
    </DemoSection>
  )
}
