import { useQuery } from '@tanstack/react-query'
import * as d3 from 'd3'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DataState } from '@/components/page/data-state'
import { DemoSection } from '@/components/page/demo-section'
import { Toggle } from '@/components/ui/toggle'
import { useElementSize } from '@/hooks/use-element-size'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { badgeFor } from '@/lib/badge'
import type { NpmDownloads } from '@/lib/sources/npm'
import { npmDownloadsQuery } from '../queries'

interface Week {
  date: Date
  [pkg: string]: number | Date
}

/** Sum daily downloads into weeks (52 points reads better than 365). */
function weekly(data: NpmDownloads): { weeks: Week[]; names: string[] } {
  const names = data.packages.map((p) => p.name)
  const weeks: Week[] = []
  for (let i = 0; i + 7 <= data.days.length; i += 7) {
    const w: Week = { date: new Date(data.days[i]) }
    for (const p of data.packages) w[p.name] = d3.sum(p.downloads.slice(i, i + 7))
    weeks.push(w)
  }
  return { weeks, names }
}

const H = 380
const M = { top: 16, right: 16, bottom: 28, left: 16 }

function Stream({ data, enabled }: { data: NpmDownloads; enabled: Set<string> }) {
  const wrap = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const { width } = useElementSize(wrap)
  const reduced = usePrefersReducedMotion()
  const { weeks, names } = useMemo(() => weekly(data), [data])

  useEffect(() => {
    const el = svgRef.current
    if (!el || width === 0) return
    const svg = d3.select(el)
    // Disabled packages keep their layer at zero, so paths keep the same
    // point count and d3 can interpolate them smoothly.
    const stack = d3
      .stack<Week>()
      .keys(names)
      .value((d, key) => (enabled.has(key) ? (d[key] as number) : 0))
      .offset(d3.stackOffsetWiggle)
      .order(d3.stackOrderInsideOut)
    const series = stack(weeks)
    const x = d3
      .scaleUtc()
      .domain(d3.extent(weeks, (d) => d.date) as [Date, Date])
      .range([M.left, width - M.right])
    const y = d3
      .scaleLinear()
      .domain([
        d3.min(series, (s) => d3.min(s, (d) => d[0])) ?? 0,
        d3.max(series, (s) => d3.max(s, (d) => d[1])) ?? 1,
      ])
      .range([H - M.bottom, M.top])
    const area = d3
      .area<d3.SeriesPoint<Week>>()
      .x((d) => x(d.data.date))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]))
      .curve(d3.curveBasis)
    const t = d3
      .transition()
      .duration(reduced ? 0 : 900)
      .ease(d3.easeCubicInOut)

    svg
      .selectAll<SVGPathElement, d3.Series<Week, string>>('path.layer')
      .data(series, (s) => s.key)
      .join((enter) =>
        enter
          .append('path')
          .attr('class', 'layer')
          .attr('fill', (s) => `var(--series-${names.indexOf(s.key) + 1})`)
          .attr('stroke', 'var(--card)')
          .attr('stroke-width', 1)
          .attr('d', area),
      )
      .transition(t)
      .attr('d', area)
      .attr('fill-opacity', (s) => (enabled.has(s.key) ? 0.9 : 0))

    svg
      .selectAll<SVGGElement, null>('g.x')
      .data([null])
      .join('g')
      .attr('class', 'x')
      .attr('transform', `translate(0,${H - M.bottom})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(width / 110)
          .tickSizeOuter(0),
      )
      .call((g) => g.select('.domain').attr('stroke', 'var(--border)'))
      .call((g) => g.selectAll('.tick line').attr('stroke', 'var(--border)'))
      .call((g) => g.selectAll('.tick text').attr('fill', 'var(--muted-foreground)'))

    // Direct labels at each layer's thickest week.
    svg
      .selectAll<SVGTextElement, d3.Series<Week, string>>('text.label')
      .data(series, (s) => s.key)
      .join('text')
      .attr('class', 'label')
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('font-weight', 600)
      .attr('fill', 'var(--foreground)')
      .attr('paint-order', 'stroke')
      .attr('stroke', 'var(--card)')
      .attr('stroke-width', 3)
      .attr('pointer-events', 'none')
      .text((s) => s.key)
      .transition(t)
      .attr('opacity', (s) => (enabled.has(s.key) ? 1 : 0))
      .attr('transform', (s) => {
        const best = s.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a))
        return `translate(${x(best.data.date)},${y((best[0] + best[1]) / 2) + 4})`
      })

    const rule = svg
      .selectAll<SVGLineElement, null>('line.rule')
      .data([null])
      .join('line')
      .attr('class', 'rule')
      .attr('y1', M.top)
      .attr('y2', H - M.bottom)
      .attr('stroke', 'var(--foreground)')
      .attr('stroke-opacity', 0)
    const tip = tipRef.current
    const bisect = d3.bisector<Week, Date>((d) => d.date).center
    svg
      .on('pointermove', (e: PointerEvent) => {
        const [mx] = d3.pointer(e)
        const w = weeks[bisect(weeks, x.invert(mx))]
        rule.attr('x1', x(w.date)).attr('x2', x(w.date)).attr('stroke-opacity', 0.4)
        if (!tip) return
        tip.innerHTML = `<p class="font-medium mb-1">Week of ${d3.utcFormat('%b %d, %Y')(w.date)}</p>${names
          .filter((n) => enabled.has(n))
          .map(
            (n) =>
              `<p class="flex justify-between gap-4"><span><span style="background:var(--series-${names.indexOf(n) + 1})" class="inline-block size-2 rounded-full mr-1.5"></span>${n}</span><span class="font-mono">${d3.format('.3s')(w[n] as number)}</span></p>`,
          )
          .join('')}`
        tip.style.opacity = '1'
        const left = Math.min(x(w.date) + 12, width - 200)
        tip.style.transform = `translate(${left}px, 12px)`
      })
      .on('pointerleave', () => {
        rule.attr('stroke-opacity', 0)
        if (tip) tip.style.opacity = '0'
      })
    return () => {
      svg.on('pointermove', null).on('pointerleave', null)
      svg.selectAll('*').interrupt()
    }
  }, [weeks, names, enabled, width, reduced])

  return (
    <div ref={wrap} className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={H}
        className="w-full"
        role="img"
        aria-label="Streamgraph of weekly npm downloads per library"
      />
      <div
        ref={tipRef}
        className="pointer-events-none absolute top-0 left-0 w-48 rounded-md border bg-popover p-2 text-xs opacity-0 shadow-md"
      />
    </div>
  )
}

export function StreamgraphDemo() {
  const query = useQuery(npmDownloadsQuery())
  const { source, reason } = badgeFor(query)
  const [enabled, setEnabled] = useState<Set<string>>(
    new Set(['d3', 'echarts', 'gsap', 'motion', '@react-spring/web']),
  )
  const names = query.data?.data.packages.map((p) => p.name) ?? []
  return (
    <DemoSection
      id="streamgraph"
      index={5}
      title="Streamgraph of npm downloads"
      description="Weekly downloads of the five libraries on this site, stacked with a wiggle offset and inside-out ordering so the thickest streams sit in the middle. Toggling a package animates its layer to zero instead of removing it, so every path morphs smoothly. Hover for weekly figures."
      source={source}
      sourceReason={reason}
      sourceLabel="npm registry downloads API"
      controls={
        <div className="flex flex-wrap gap-1.5">
          {names.map((n, i) => (
            <Toggle
              key={n}
              size="sm"
              variant="outline"
              pressed={enabled.has(n)}
              onPressedChange={(on) =>
                setEnabled((prev) => {
                  const next = new Set(prev)
                  if (on) next.add(n)
                  else if (next.size > 1) next.delete(n)
                  return next
                })
              }
              className="gap-1.5"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ background: `var(--series-${i + 1})` }}
              />
              {n}
            </Toggle>
          ))}
        </div>
      }
    >
      <DataState query={query} className="h-[380px]">
        {(data) => <Stream data={data} enabled={enabled} />}
      </DataState>
    </DemoSection>
  )
}
