import { useQuery } from '@tanstack/react-query'
import * as d3 from 'd3'
import {
  sankey,
  sankeyLinkHorizontal,
  type SankeyLink,
  type SankeyNode,
} from 'd3-sankey'
import { useEffect, useMemo, useRef, useState } from 'react'
import { SliderControl } from '@/components/page/control'
import { DataState } from '@/components/page/data-state'
import { DemoSection } from '@/components/page/demo-section'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { useElementSize } from '@/hooks/use-element-size'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { badgeFor } from '@/lib/badge'
import { alpha } from '@/lib/colors'
import { land } from '@/lib/geo'
import type { NobelData } from '@/lib/sources/nobel'
import type { TemperatureYear } from '@/lib/sources/openmeteo'
import type { Quake } from '@/lib/sources/usgs'
import { CATEGORIES, categoryIndex } from '../nobel'
import { nobelQuery, quakesQuery, temperatureYearQuery } from '../queries'

/* ---------- Sankey: birth country → category → gender ---------- */

interface SNode {
  name: string
  column: 0 | 1 | 2
}
type SN = SankeyNode<SNode, object>
type SL = SankeyLink<SNode, object>

function buildSankey(data: NobelData) {
  const rows = data.laureates.flatMap((l) =>
    l.prizes.map((p) => ({
      country: l.country ?? 'Unknown',
      category: p.category,
      gender:
        l.gender === 'org'
          ? 'Organization'
          : l.gender === 'female'
            ? 'Female'
            : 'Male',
    })),
  )
  const top = d3
    .rollups(
      rows,
      (v) => v.length,
      (r) => r.country,
    )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([c]) => c)
  const countryOf = (c: string) => (top.includes(c) ? c : 'Rest of world')
  const nodes: SNode[] = [
    ...[...top, 'Rest of world'].map((name) => ({ name, column: 0 as const })),
    ...CATEGORIES.map((name) => ({ name, column: 1 as const })),
    ...['Male', 'Female', 'Organization'].map((name) => ({
      name,
      column: 2 as const,
    })),
  ]
  const index = new Map(nodes.map((n, i) => [`${n.column}:${n.name}`, i]))
  const a = d3.rollups(
    rows,
    (v) => v.length,
    (r) => countryOf(r.country),
    (r) => r.category,
  )
  const b = d3.rollups(
    rows,
    (v) => v.length,
    (r) => r.category,
    (r) => r.gender,
  )
  const links = [
    ...a.flatMap(([c, cats]) =>
      cats.map(([cat, value]) => ({
        source: index.get(`0:${c}`) ?? 0,
        target: index.get(`1:${cat}`) ?? 0,
        value,
      })),
    ),
    ...b.flatMap(([cat, gs]) =>
      gs.map(([g, value]) => ({
        source: index.get(`1:${cat}`) ?? 0,
        target: index.get(`2:${g}`) ?? 0,
        value,
      })),
    ),
  ]
  return { nodes, links }
}

function Sankey({ data }: { data: NobelData }) {
  const wrap = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const { width } = useElementSize(wrap)
  const reduced = usePrefersReducedMotion()
  const graph = useMemo(() => buildSankey(data), [data])
  const H = 460

  useEffect(() => {
    const el = svgRef.current
    if (!el || width === 0) return
    const svg = d3.select(el)
    svg.selectAll('*').remove()
    const layout = sankey<SNode, object>()
      .nodeWidth(12)
      .nodePadding(10)
      .extent([
        [1, 8],
        [width - 1, H - 8],
      ])
    const { nodes, links } = layout({
      nodes: graph.nodes.map((n) => ({ ...n })),
      links: graph.links.map((l) => ({ ...l })),
    })
    const colorOf = (n: SN) =>
      n.column === 1
        ? `var(--series-${categoryIndex(n.name) + 1})`
        : n.column === 2
          ? 'var(--muted-foreground)'
          : 'color-mix(in oklab, var(--foreground) 55%, var(--card))'

    const link = svg
      .append('g')
      .attr('fill', 'none')
      .selectAll<SVGPathElement, SL>('path')
      .data(links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (l) =>
        colorOf(
          (l.source as SN).column === 1 ? (l.source as SN) : (l.target as SN),
        ),
      )
      .attr('stroke-opacity', 0.35)
      .attr('stroke-width', (l) => Math.max(1, l.width ?? 1))
    link
      .append('title')
      .text(
        (l) =>
          `${(l.source as SN).name} → ${(l.target as SN).name}: ${l.value}`,
      )
    if (!reduced) {
      link
        .attr('stroke-dasharray', function () {
          const len = (this as SVGPathElement).getTotalLength()
          return `${len} ${len}`
        })
        .attr('stroke-dashoffset', function () {
          return (this as SVGPathElement).getTotalLength()
        })
        .transition()
        .delay((_, i) => i * 8)
        .duration(900)
        .attr('stroke-dashoffset', 0)
    }

    const node = svg
      .append('g')
      .selectAll<SVGRectElement, SN>('rect')
      .data(nodes)
      .join('rect')
    node
      .attr('x', (d) => d.x0 ?? 0)
      .attr('y', (d) => d.y0 ?? 0)
      .attr('height', (d) => Math.max(1, (d.y1 ?? 0) - (d.y0 ?? 0)))
      .attr('width', (d) => (d.x1 ?? 0) - (d.x0 ?? 0))
      .attr('rx', 2)
      .attr('fill', colorOf)
      .on('pointerenter', (_e: PointerEvent, d) =>
        link.attr('stroke-opacity', (l) =>
          (l.source as SN) === d || (l.target as SN) === d ? 0.75 : 0.06,
        ),
      )
      .on('pointerleave', () => link.attr('stroke-opacity', 0.35))
    node.append('title').text((d) => `${d.name}: ${d.value ?? 0} prizes`)

    svg
      .append('g')
      .attr('font-size', 11)
      .attr('pointer-events', 'none')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('x', (d) =>
        (d.x0 ?? 0) < width / 2 ? (d.x1 ?? 0) + 6 : (d.x0 ?? 0) - 6,
      )
      .attr('y', (d) => ((d.y1 ?? 0) + (d.y0 ?? 0)) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d) => ((d.x0 ?? 0) < width / 2 ? 'start' : 'end'))
      .attr('fill', 'var(--foreground)')
      .attr('paint-order', 'stroke')
      .attr('stroke', 'var(--card)')
      .attr('stroke-width', 3)
      .text((d) => `${d.name} (${d.value ?? 0})`)
    return () => {
      svg.selectAll('*').interrupt().remove()
    }
  }, [graph, width, reduced])

  return (
    <div ref={wrap}>
      <svg
        ref={svgRef}
        width={width}
        height={H}
        className="w-full"
        role="img"
        aria-label="Sankey diagram from birth country to prize category to gender"
      />
    </div>
  )
}

/* ---------- Radial temperature year ---------- */

function RadialTemperature({ data }: { data: TemperatureYear }) {
  const wrap = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const { width } = useElementSize(wrap)
  const reduced = usePrefersReducedMotion()
  const theme = useChartTheme()

  useEffect(() => {
    const el = svgRef.current
    if (!el || width === 0) return
    const size = Math.min(width, 520)
    const inner = size * 0.16
    const outer = size / 2 - 28
    const svg = d3
      .select(el)
      .attr('viewBox', `${-size / 2} ${-size / 2} ${size} ${size}`)
    svg.selectAll('*').remove()
    const days = data.days
    const x = d3
      .scaleBand<number>()
      .domain(d3.range(days.length))
      .range([0, 2 * Math.PI])
    const lo = d3.min(days, (d) => d.min) ?? -5
    const hi = d3.max(days, (d) => d.max) ?? 30
    const y = d3
      .scaleRadial()
      .domain([lo - 2, hi + 2])
      .range([inner, outer])
    // Diverging: cool pole → neutral → warm pole, centered on the year's mean.
    const mean = d3.mean(days, (d) => (d.max + d.min) / 2) ?? 12
    const color = d3
      .scaleDiverging(d3.interpolateRgbBasis(theme.div))
      .domain([lo, mean, hi])

    // Temperature rings.
    const ticks = y.ticks(5)
    const g = svg.append('g')
    g.selectAll('circle')
      .data(ticks)
      .join('circle')
      .attr('r', (t) => y(t))
      .attr('fill', 'none')
      .attr('stroke', 'var(--grid)')
    g.selectAll('text')
      .data(ticks)
      .join('text')
      .attr('y', (t) => -y(t))
      .attr('dy', '-0.3em')
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr('fill', 'var(--muted-foreground)')
      .text((t) => `${t}°`)

    const arc = d3
      .arc<TemperatureYear['days'][number] & { i: number }>()
      .innerRadius((d) => y(d.min))
      .outerRadius((d) => y(d.max))
      .startAngle((d) => x(d.i) ?? 0)
      .endAngle((d) => (x(d.i) ?? 0) + x.bandwidth())
      .padAngle(0.002)
      .padRadius(inner)
    const bars = svg
      .append('g')
      .selectAll('path')
      .data(days.map((d, i) => ({ ...d, i })))
      .join('path')
      .attr('fill', (d) => color(d.max))
    bars
      .append('title')
      .text((d) => `${d.date}: ${d.min.toFixed(1)}° – ${d.max.toFixed(1)}°`)
    if (reduced) {
      bars.attr('d', arc)
    } else {
      // Grow each bar out from the mean, day by day around the circle.
      bars
        .attr('d', (d) => arc({ ...d, min: mean, max: mean + 0.01 }))
        .transition()
        .delay((d) => d.i * 4)
        .duration(600)
        .attrTween('d', (d) => {
          const iMin = d3.interpolate(mean, d.min)
          const iMax = d3.interpolate(mean + 0.01, d.max)
          return (t) => arc({ ...d, min: iMin(t), max: iMax(t) }) ?? ''
        })
    }

    const months = d3.utcMonths(
      new Date(`${data.year}-01-01`),
      new Date(`${data.year + 1}-01-01`),
    )
    svg
      .append('g')
      .selectAll('text')
      .data(months)
      .join('text')
      .attr('transform', (m) => {
        const i = d3.utcDay.count(new Date(`${data.year}-01-01`), m) + 15
        const a = (x(Math.min(i, days.length - 1)) ?? 0) - Math.PI / 2
        return `translate(${Math.cos(a) * (outer + 16)},${Math.sin(a) * (outer + 16)})`
      })
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', 11)
      .attr('fill', 'var(--muted-foreground)')
      .text(d3.utcFormat('%b'))
    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('font-size', 20)
      .attr('font-weight', 700)
      .attr('fill', 'var(--foreground)')
      .text(data.year)
    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .attr('font-size', 11)
      .attr('fill', 'var(--muted-foreground)')
      .text(data.city)
    return () => {
      svg.selectAll('*').interrupt().remove()
    }
  }, [data, width, reduced, theme])

  return (
    <div ref={wrap} className="flex justify-center">
      <svg
        ref={svgRef}
        className="aspect-square w-full max-w-[520px]"
        role="img"
        aria-label={`Radial chart of daily temperature ranges in ${data.city}, ${data.year}`}
      />
    </div>
  )
}

/* ---------- Earthquake contour density ---------- */

function QuakeDensity({
  points,
  bandwidth,
}: {
  points: Quake[]
  bandwidth: number
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const { width } = useElementSize(wrap)
  const theme = useChartTheme()
  const H = Math.round(width * 0.5)

  useEffect(() => {
    const el = svgRef.current
    if (!el || width === 0) return
    const svg = d3.select(el)
    svg.selectAll('*').remove()
    const projection = d3
      .geoEquirectangular()
      .fitSize([width, H], { type: 'Sphere' })
    const path = d3.geoPath(projection)
    svg
      .append('path')
      .datum(land)
      .attr('d', path)
      .attr('fill', alpha(theme.muted, 0.18))
      .attr('stroke', alpha(theme.muted, 0.4))
      .attr('stroke-width', 0.5)
    const projected = points.map((q) => {
      const [x, y] = projection([q.lon, q.lat]) ?? [0, 0]
      return { x, y, w: Math.max(0.5, q.mag) }
    })
    const contours = d3
      .contourDensity<{ x: number; y: number; w: number }>()
      .x((d) => d.x)
      .y((d) => d.y)
      .weight((d) => d.w)
      .size([width, H])
      .bandwidth(bandwidth)
      .thresholds(14)(projected)
    const maxV = d3.max(contours, (c) => c.value) ?? 1
    const ramp = d3.interpolateRgbBasis([
      alpha(theme.div[2], 0.05),
      theme.div[2],
    ])
    svg
      .append('g')
      .selectAll('path')
      .data(contours)
      .join('path')
      .attr('d', d3.geoPath())
      .attr('fill', (c) => ramp(c.value / maxV))
      .attr('fill-opacity', 0.3)
      .attr('stroke', alpha(theme.div[2], 0.6))
      .attr('stroke-width', 0.5)
    svg
      .append('g')
      .selectAll('circle')
      .data(projected)
      .join('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', 1)
      .attr('fill', 'var(--foreground)')
      .attr('opacity', 0.35)
  }, [points, bandwidth, width, H, theme])

  return (
    <div ref={wrap}>
      <svg
        ref={svgRef}
        width={width}
        height={H}
        className="w-full"
        role="img"
        aria-label="Kernel density contours of this week's earthquakes on a world map"
      />
    </div>
  )
}

export function D3BonusDemo() {
  const nobel = useQuery(nobelQuery())
  const temps = useQuery(temperatureYearQuery())
  const quakes = useQuery(quakesQuery())
  const [bandwidth, setBandwidth] = useState(14)
  const { source, reason } = badgeFor(nobel, temps, quakes)
  return (
    <DemoSection
      id="bonus"
      index={9}
      title="Bonus: Sankey, radial temperatures, quake density"
      description="A d3-sankey flow of every Nobel prize from birth country to category to gender (hover a node to trace it); a radial year of daily temperature ranges from the Open-Meteo archive, bars growing out from the annual mean and colored on a diverging scale; and kernel density contours of this week's USGS earthquakes weighted by magnitude."
      source={source}
      sourceReason={reason}
      sourceLabel="Nobel · Open-Meteo archive · USGS"
      controls={
        <SliderControl
          label="Density bandwidth"
          value={bandwidth}
          min={4}
          max={40}
          onChange={setBandwidth}
          format={(v) => `${v}px`}
        />
      }
    >
      <div className="flex flex-col gap-8">
        <DataState query={nobel} className="h-[460px]">
          {(d) => <Sankey data={d} />}
        </DataState>
        <div className="grid items-center gap-6 lg:grid-cols-2">
          <DataState query={temps} isEmpty={(d) => d.days.length === 0}>
            {(d) => <RadialTemperature data={d} />}
          </DataState>
          <DataState query={quakes} isEmpty={(d) => d.quakes.length === 0}>
            {(d) => <QuakeDensity points={d.quakes} bandwidth={bandwidth} />}
          </DataState>
        </div>
      </div>
    </DemoSection>
  )
}
