import { useQuery } from '@tanstack/react-query'
import * as d3 from 'd3'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DataInspector, type InspectorColumn } from '@/components/data-inspector'
import { DataState } from '@/components/page/data-state'
import { DemoSection } from '@/components/page/demo-section'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useElementSize } from '@/hooks/use-element-size'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { badgeFor } from '@/lib/badge'
import type { Pageviews } from '@/lib/sources/wikimedia'
import { pageviewsQuery } from '../queries'

interface Point {
  date: Date
  views: number
}

const FOCUS_H = 300
const CONTEXT_H = 70
const M = { top: 14, right: 16, bottom: 24, left: 48 }

function FocusContext({ points, article }: { points: Point[]; article: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const { width } = useElementSize(wrap)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const el = svgRef.current
    if (!el || width === 0 || points.length === 0) return
    const svg = d3.select(el)
    svg.selectAll('*').remove()
    const innerW = width - M.left - M.right
    const extent = d3.extent(points, (d) => d.date) as [Date, Date]
    const x = d3.scaleUtc().domain(extent).range([0, innerW])
    const x2 = x.copy()
    // Start zoomed into the most recent quarter (the brush below mirrors this).
    const initial: [Date, Date] = [d3.utcDay.offset(extent[1], -90), extent[1]]
    x.domain(initial)
    const y = d3
      .scaleLinear()
      .domain([0, (d3.max(points, (d) => d.views) ?? 1) * 1.08])
      .nice()
      .range([FOCUS_H - M.bottom, M.top])
    const y2 = y.copy().range([CONTEXT_H - 18, 4])
    const line = d3
      .line<Point>()
      .x((d) => x(d.date))
      .y((d) => y(d.views))
      .curve(d3.curveMonotoneX)
    const area = d3
      .area<Point>()
      .x((d) => x(d.date))
      .y0(y(0))
      .y1((d) => y(d.views))
      .curve(d3.curveMonotoneX)
    const line2 = d3
      .line<Point>()
      .x((d) => x2(d.date))
      .y((d) => y2(d.views))
      .curve(d3.curveMonotoneX)

    const clipId = `clip-${article.replace(/\W/g, '')}`
    svg
      .append('defs')
      .append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('width', innerW)
      .attr('height', FOCUS_H)
    const focus = svg.append('g').attr('transform', `translate(${M.left},0)`)
    const gx = focus.append('g').attr('transform', `translate(0,${FOCUS_H - M.bottom})`)
    const gy = focus.append('g')
    const style = (g: d3.Selection<SVGGElement, unknown, null, undefined>) => {
      g.select('.domain').remove()
      g.selectAll('.tick line').attr('stroke', 'var(--grid)')
      g.selectAll('.tick text').attr('fill', 'var(--muted-foreground)')
    }
    gy.call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(d3.format('.2s'))).call(
      style,
    )
    gx.call(d3.axisBottom(x).ticks(width / 120)).call(style)

    const plot = focus.append('g').attr('clip-path', `url(#${clipId})`)
    const areaPath = plot
      .append('path')
      .datum(points)
      .attr('fill', 'var(--page-accent)')
      .attr('fill-opacity', 0.12)
      .attr('d', area)
    const linePath = plot
      .append('path')
      .datum(points)
      .attr('fill', 'none')
      .attr('stroke', 'var(--page-accent)')
      .attr('stroke-width', 2)
      .attr('d', line)

    // Path-drawing intro: animate the dash offset from full length to zero.
    const total = linePath.node()?.getTotalLength() ?? 0
    if (!reduced && total) {
      linePath
        .attr('stroke-dasharray', `${total} ${total}`)
        .attr('stroke-dashoffset', total)
        .transition()
        .duration(1600)
        .ease(d3.easeCubicInOut)
        .attr('stroke-dashoffset', 0)
        .on('end', () => linePath.attr('stroke-dasharray', null))
      areaPath.attr('opacity', 0).transition().delay(900).duration(700).attr('opacity', 1)
    }

    // Crosshair + tooltip.
    const cross = focus.append('g').attr('pointer-events', 'none').attr('opacity', 0)
    const vLine = cross
      .append('line')
      .attr('y1', M.top)
      .attr('y2', FOCUS_H - M.bottom)
      .attr('stroke', 'var(--foreground)')
      .attr('stroke-opacity', 0.35)
      .attr('stroke-dasharray', '3 3')
    const hLine = cross
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('stroke', 'var(--foreground)')
      .attr('stroke-opacity', 0.2)
      .attr('stroke-dasharray', '3 3')
    const dot = cross
      .append('circle')
      .attr('r', 4.5)
      .attr('fill', 'var(--page-accent)')
      .attr('stroke', 'var(--card)')
      .attr('stroke-width', 2)
    const tip = tipRef.current
    const bisect = d3.bisector<Point, Date>((d) => d.date).center
    focus
      .append('rect')
      .attr('width', innerW)
      .attr('height', FOCUS_H - M.bottom)
      .attr('fill', 'transparent')
      .on('pointermove', (e: PointerEvent) => {
        const [mx] = d3.pointer(e)
        const d = points[bisect(points, x.invert(mx))]
        const px = x(d.date)
        const py = y(d.views)
        cross.attr('opacity', 1)
        vLine.attr('x1', px).attr('x2', px)
        hLine.attr('y1', py).attr('y2', py)
        dot.attr('cx', px).attr('cy', py)
        if (tip) {
          tip.innerHTML = `<p class="text-muted-foreground">${d3.utcFormat('%a %b %d, %Y')(d.date)}</p><p class="font-mono font-semibold">${d.views.toLocaleString('en')} views</p>`
          tip.style.opacity = '1'
          tip.style.transform = `translate(${Math.min(M.left + px + 12, width - 150)}px, ${Math.max(0, py - 44)}px)`
        }
      })
      .on('pointerleave', () => {
        cross.attr('opacity', 0)
        if (tip) tip.style.opacity = '0'
      })

    // Context chart with a brush that drives the focus domain.
    const context = svg
      .append('g')
      .attr('transform', `translate(${M.left},${FOCUS_H + 8})`)
    context
      .append('path')
      .datum(points)
      .attr('fill', 'none')
      .attr('stroke', 'var(--muted-foreground)')
      .attr('stroke-width', 1)
      .attr('d', line2)
    context
      .append('g')
      .attr('transform', `translate(0,${CONTEXT_H - 18})`)
      .call(
        d3
          .axisBottom(x2)
          .ticks(width / 120)
          .tickSize(0)
          .tickPadding(4),
      )
      .call(style)
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [innerW, CONTEXT_H - 18],
      ])
      .on('brush end', (e: d3.D3BrushEvent<unknown>) => {
        // Ignore programmatic moves so they don't interrupt the intro drawing.
        if (!e.sourceEvent) return
        const sel = e.selection as [number, number] | null
        x.domain(sel ? sel.map(x2.invert) : x2.domain())
        const t = d3.transition().duration(e.type === 'end' && !reduced ? 400 : 0)
        linePath.transition(t).attr('d', line)
        areaPath.transition(t).attr('d', area)
        gx.transition(t)
          .call(d3.axisBottom(x).ticks(width / 120))
          .on('end', () => style(gx))
      })
    const gb = context.append('g').call(brush)
    gb.selectAll('.selection')
      .attr('fill', 'var(--page-accent)')
      .attr('fill-opacity', 0.2)
      .attr('stroke', 'var(--page-accent)')
    gb.call(brush.move, [x2(initial[0]), innerW])

    return () => {
      svg.selectAll('*').interrupt().remove()
    }
  }, [points, article, width, reduced])

  return (
    <div ref={wrap} className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={FOCUS_H + CONTEXT_H + 8}
        className="w-full"
        role="img"
        aria-label={`Daily Wikipedia pageviews for ${article.replace(/_/g, ' ')}`}
      />
      <div
        ref={tipRef}
        className="pointer-events-none absolute top-0 left-0 rounded-md border bg-popover px-2 py-1 text-xs opacity-0 shadow-md"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        Drag in the lower strip to brush a date range; the chart above zooms to it.
      </p>
    </div>
  )
}

function toPoints(pv: Pageviews, article: string): Point[] {
  return (pv.articles.find((a) => a.article === article)?.points ?? []).map((p) => ({
    date: new Date(p.date),
    views: p.views,
  }))
}

export function PageviewsDemo() {
  const query = useQuery(pageviewsQuery())
  const { source, reason } = badgeFor(query)
  const articles = query.data?.data.articles.map((a) => a.article) ?? []
  const [article, setArticle] = useState('D3.js')
  const pv = query.data?.data
  const points = useMemo(() => (pv ? toPoints(pv, article) : []), [pv, article])
  const columns: InspectorColumn<Point>[] = [
    {
      id: 'date',
      header: 'Date',
      value: (p) => p.date.toISOString().slice(0, 10),
    },
    { id: 'views', header: 'Views', value: (p) => p.views, numeric: true },
  ]
  return (
    <DemoSection
      id="pageviews"
      index={7}
      title="Wikipedia pageviews: brush to zoom"
      description="A year of daily views from the Wikimedia REST API. The line draws itself in with an animated dash offset; hover for a crosshair tooltip; brush the context strip to zoom the focus chart (it starts on the last quarter)."
      source={source}
      sourceReason={reason}
      sourceLabel="Wikimedia REST API"
      controls={
        <>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={article}
            onValueChange={(v) => v && setArticle(v)}
          >
            {articles.map((a) => (
              <ToggleGroupItem key={a} value={a} className="px-3">
                {a.replace(/_/g, ' ')}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <DataInspector
            title={`Pageviews: ${article.replace(/_/g, ' ')}`}
            description="Daily views on en.wikipedia (all access, all agents)."
            rows={points}
            columns={columns}
          />
        </>
      }
    >
      <DataState query={query} isEmpty={() => points.length === 0} className="h-[380px]">
        {() => <FocusContext points={points} article={article} />}
      </DataState>
    </DemoSection>
  )
}
