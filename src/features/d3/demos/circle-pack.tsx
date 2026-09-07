import { useQuery } from '@tanstack/react-query'
import * as d3 from 'd3'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DataState } from '@/components/page/data-state'
import { DemoSection } from '@/components/page/demo-section'
import { useElementSize } from '@/hooks/use-element-size'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { badgeFor } from '@/lib/badge'
import type { NobelData } from '@/lib/sources/nobel'
import { CATEGORIES } from '../nobel'
import { nobelQuery } from '../queries'

interface PackDatum {
  name: string
  value?: number
  category?: number
  children?: PackDatum[]
}

/** Nobel → category → decade → laureate. */
function buildHierarchy(data: NobelData): PackDatum {
  const prizes = data.laureates.flatMap((l) =>
    l.prizes.map((p) => ({ name: l.name, ...p })),
  )
  return {
    name: 'Nobel Prizes',
    children: CATEGORIES.map((cat, ci) => ({
      name: cat,
      category: ci,
      children: d3
        .groups(
          prizes.filter((p) => p.category === cat),
          (p) => Math.floor(p.year / 10) * 10,
        )
        .sort((a, b) => a[0] - b[0])
        .map(([decade, list]) => ({
          name: `${decade}s`,
          category: ci,
          children: list.map((p) => ({
            name: `${p.name} (${p.year})`,
            value: 1,
            category: ci,
          })),
        })),
    })),
  }
}

function Pack({ data }: { data: NobelData }) {
  const wrap = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const { width } = useElementSize(wrap)
  const reduced = usePrefersReducedMotion()
  const [focusName, setFocusName] = useState('Nobel Prizes')
  const tree = useMemo(() => buildHierarchy(data), [data])

  useEffect(() => {
    const el = svgRef.current
    if (!el || width === 0) return
    const size = Math.min(width, 680)
    const root = d3.pack<PackDatum>().size([size, size]).padding(3)(
      d3
        .hierarchy(tree)
        .sum((d) => d.value ?? 0)
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
    )
    const svg = d3.select(el).attr('viewBox', `${-size / 2} ${-size / 2} ${size} ${size}`)
    svg.selectAll('*').remove()

    const color = (d: d3.HierarchyCircularNode<PackDatum>) =>
      d.depth === 0
        ? 'transparent'
        : `color-mix(in oklab, var(--series-${(d.data.category ?? 0) + 1}) ${d.children ? 18 + d.depth * 12 : 85}%, var(--card))`

    const node = svg
      .append('g')
      .selectAll<SVGCircleElement, d3.HierarchyCircularNode<PackDatum>>('circle')
      .data(root.descendants().slice(1))
      .join('circle')
      .attr('fill', color)
      .attr('stroke', (d) =>
        d.children ? `var(--series-${(d.data.category ?? 0) + 1})` : 'none',
      )
      .attr('stroke-opacity', 0.35)
      .attr('pointer-events', (d) => (d.children ? null : 'none'))
      .style('cursor', 'pointer')
      .on('click', (event: MouseEvent, d) => {
        if (focus !== d) {
          zoom(event, d)
          event.stopPropagation()
        }
      })
    node.append('title').text(
      (d) =>
        `${d
          .ancestors()
          .map((a) => a.data.name)
          .reverse()
          .slice(1)
          .join(' › ')}\n${d.value ?? 0} prizes`,
    )

    const label = svg
      .append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .selectAll<SVGTextElement, d3.HierarchyCircularNode<PackDatum>>('text')
      .data(root.descendants())
      .join('text')
      .attr('fill', 'var(--foreground)')
      .attr('font-weight', (d) => (d.depth === 1 ? 600 : 400))
      .attr('paint-order', 'stroke')
      .attr('stroke', 'var(--card)')
      .attr('stroke-width', 3)
      .style('fill-opacity', (d) => (d.parent === root ? 1 : 0))
      .style('display', (d) => (d.parent === root ? 'inline' : 'none'))
      .text((d) => d.data.name)

    let focus = root
    let view: [number, number, number] = [root.x, root.y, root.r * 2]

    const zoomTo = (v: [number, number, number]) => {
      const k = size / v[2]
      view = v
      label
        .attr('transform', (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`)
        .attr('font-size', (d) => (d.depth === 1 ? 13 : 11))
      node
        .attr('transform', (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`)
        .attr('r', (d) => d.r * k)
    }

    function zoom(event: MouseEvent | null, d: d3.HierarchyCircularNode<PackDatum>) {
      focus = d
      setFocusName(
        d
          .ancestors()
          .map((a) => a.data.name)
          .reverse()
          .join(' › '),
      )
      const duration = reduced ? 0 : event?.altKey ? 7500 : 750
      svg
        .transition()
        .duration(duration)
        .tween('zoom', () => {
          const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2])
          return (t) => zoomTo(i(t))
        })
      label
        .filter(function (n) {
          return n.parent === focus || (this as SVGTextElement).style.display === 'inline'
        })
        .transition()
        .duration(duration)
        .style('fill-opacity', (n) => (n.parent === focus ? 1 : 0))
        .on('start', function (n) {
          if (n.parent === focus) (this as SVGTextElement).style.display = 'inline'
        })
        .on('end', function (n) {
          if (n.parent !== focus) (this as SVGTextElement).style.display = 'none'
        })
    }

    svg.on('click', (event: MouseEvent) => zoom(event, root))
    zoomTo([root.x, root.y, root.r * 2])
    return () => {
      svg.interrupt().on('click', null)
      svg.selectAll('*').interrupt().remove()
    }
  }, [tree, width, reduced])

  return (
    <div ref={wrap} className="flex flex-col items-center gap-2">
      <p className="self-start font-mono text-xs text-muted-foreground">{focusName}</p>
      <svg
        ref={svgRef}
        className="aspect-square w-full max-w-[680px]"
        role="img"
        aria-label="Zoomable circle packing of Nobel prizes by category and decade"
      />
      <p className="text-xs text-muted-foreground">
        Click a circle to zoom in, click the background to zoom out.
      </p>
    </div>
  )
}

export function CirclePackDemo() {
  const query = useQuery(nobelQuery())
  const { source, reason } = badgeFor(query)
  return (
    <DemoSection
      id="pack"
      index={2}
      title="Zoomable circle packing"
      description="Every Nobel prize nested by category and decade, sized by count. d3.pack computes the layout once; zooming interpolates the view with d3.interpolateZoom, so the camera glides smoothly between levels while labels fade in and out."
      source={source}
      sourceReason={reason}
      sourceLabel="Nobel Prize API v2.1"
    >
      <DataState query={query} className="h-[36rem]">
        {(data) => <Pack data={data} />}
      </DataState>
    </DemoSection>
  )
}
