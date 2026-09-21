import { useQuery } from '@tanstack/react-query'
import * as d3 from 'd3'
import { useEffect, useMemo, useRef, useState } from 'react'
import { SliderControl } from '@/components/page/control'
import { DataState } from '@/components/page/data-state'
import { DemoSection } from '@/components/page/demo-section'
import { useElementSize } from '@/hooks/use-element-size'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { badgeFor } from '@/lib/badge'
import type { FxData } from '@/lib/sources/frankfurter'
import { fxQuery } from '../queries'

/** |Pearson correlation| of daily log returns between every currency pair (vs EUR). */
function correlationMatrix(fx: FxData, threshold: number) {
  const returns = fx.currencies.map((c) => {
    const s = fx.series[c]
    return s.slice(1).map((v, i) => Math.log(v / s[i]))
  })
  const corr = (a: number[], b: number[]) => {
    const ma = d3.mean(a) ?? 0
    const mb = d3.mean(b) ?? 0
    let num = 0
    let da = 0
    let db = 0
    for (let i = 0; i < a.length; i++) {
      num += (a[i] - ma) * (b[i] - mb)
      da += (a[i] - ma) ** 2
      db += (b[i] - mb) ** 2
    }
    return num / Math.sqrt(da * db || 1)
  }
  const signed = returns.map((a) => returns.map((b) => corr(a, b)))
  const matrix = signed.map((row, i) =>
    row.map((v, j) => (i === j || Math.abs(v) < threshold ? 0 : Math.abs(v))),
  )
  return { matrix, signed }
}

function Chord({ fx, threshold }: { fx: FxData; threshold: number }) {
  const wrap = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const { width } = useElementSize(wrap)
  const reduced = usePrefersReducedMotion()
  const { matrix, signed } = useMemo(
    () => correlationMatrix(fx, threshold),
    [fx, threshold],
  )
  const names = fx.currencies

  useEffect(() => {
    const el = svgRef.current
    if (!el || width === 0) return
    const size = Math.min(width, 560)
    const outer = size / 2 - 44
    const inner = outer - 14
    const svg = d3
      .select(el)
      .attr('viewBox', `${-size / 2} ${-size / 2} ${size} ${size}`)
    svg.selectAll('*').remove()
    const chords = d3.chord().padAngle(0.04).sortSubgroups(d3.descending)(
      matrix,
    )
    const color = (i: number) => `var(--series-${(i % 8) + 1})`
    const arc = d3.arc<d3.ChordGroup>().innerRadius(inner).outerRadius(outer)
    const ribbon = d3.ribbon<d3.Chord, d3.ChordSubgroup>().radius(inner - 2)

    const ribbons = svg
      .append('g')
      .attr('fill-opacity', 0.7)
      .selectAll<SVGPathElement, d3.Chord>('path')
      .data(chords)
      .join('path')
      .attr('d', ribbon)
      .attr('fill', (d) => color(d.source.index))
      .attr('stroke', 'var(--card)')
      .attr('stroke-width', 0.5)
    ribbons
      .append('title')
      .text(
        (d) =>
          `${names[d.source.index]} ↔ ${names[d.target.index]}: ρ = ${signed[d.source.index][d.target.index].toFixed(2)}`,
      )
    if (!reduced) {
      ribbons
        .attr('opacity', 0)
        .transition()
        .delay((_, i) => i * 20)
        .duration(500)
        .attr('opacity', 1)
    }

    const group = svg
      .append('g')
      .selectAll<SVGGElement, d3.ChordGroup>('g')
      .data(chords.groups)
      .join('g')
    group
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.index))
      .attr('stroke', 'var(--card)')
      .style('cursor', 'pointer')
    group
      .append('text')
      .each((d) => {
        ;(d as d3.ChordGroup & { angle: number }).angle =
          (d.startAngle + d.endAngle) / 2
      })
      .attr('dy', '0.35em')
      .attr('font-size', 12)
      .attr('font-weight', 600)
      .attr('fill', 'var(--foreground)')
      .attr('transform', (d) => {
        const a = (d.startAngle + d.endAngle) / 2
        return `rotate(${(a * 180) / Math.PI - 90}) translate(${outer + 8}) ${a > Math.PI ? 'rotate(180)' : ''}`
      })
      .attr('text-anchor', (d) =>
        (d.startAngle + d.endAngle) / 2 > Math.PI ? 'end' : null,
      )
      .text((d) => names[d.index])

    // Hover a currency to isolate its relationships.
    group
      .on('pointerenter', (_e: PointerEvent, g) => {
        ribbons
          .transition()
          .duration(reduced ? 0 : 200)
          .attr('fill-opacity', (d) =>
            d.source.index === g.index || d.target.index === g.index
              ? 0.9
              : 0.05,
          )
      })
      .on('pointerleave', () => {
        ribbons
          .transition()
          .duration(reduced ? 0 : 200)
          .attr('fill-opacity', 0.7)
      })
    return () => {
      svg.selectAll('*').interrupt().remove()
    }
  }, [matrix, signed, names, width, reduced])

  return (
    <div ref={wrap} className="flex justify-center">
      <svg
        ref={svgRef}
        className="aspect-square w-full max-w-[560px]"
        role="img"
        aria-label="Chord diagram of correlations between currency returns"
      />
    </div>
  )
}

export function ChordDemo() {
  const query = useQuery(fxQuery())
  const { source, reason } = badgeFor(query)
  const [threshold, setThreshold] = useState(0.2)
  return (
    <DemoSection
      id="chord"
      index={6}
      title="Chord diagram of currency relationships"
      description="How closely currencies move together against the euro: each ribbon's width is the absolute correlation of two currencies' daily log returns over the past year (ECB reference rates via Frankfurter). Hover a currency to isolate its relationships; raise the threshold to hide weak ones."
      source={source}
      sourceReason={reason}
      sourceLabel="Frankfurter (ECB rates)"
      controls={
        <SliderControl
          label="Min |ρ|"
          value={threshold}
          min={0}
          max={0.8}
          step={0.05}
          onChange={setThreshold}
          format={(v) => v.toFixed(2)}
        />
      }
    >
      <DataState
        query={query}
        isEmpty={(d) => d.currencies.length < 2}
        className="h-[36rem]"
      >
        {(fx) => <Chord fx={fx} threshold={threshold} />}
      </DataState>
    </DemoSection>
  )
}
