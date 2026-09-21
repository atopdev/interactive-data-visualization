import { useQuery } from '@tanstack/react-query'
import * as d3 from 'd3'
import { RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { DataInspector } from '@/components/data-inspector'
import { SliderControl } from '@/components/page/control'
import { DataState } from '@/components/page/data-state'
import { DemoSection } from '@/components/page/demo-section'
import { Button } from '@/components/ui/button'
import { useElementSize } from '@/hooks/use-element-size'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { badgeFor } from '@/lib/badge'
import type { Laureate, NobelData } from '@/lib/sources/nobel'
import { CATEGORIES, categoryIndex } from '../nobel'
import { nobelQuery } from '../queries'

type Kind = 'category' | 'country' | 'laureate'
interface GNode extends d3.SimulationNodeDatum {
  id: string
  label: string
  kind: Kind
  weight: number
  group: number
}
interface GLink extends d3.SimulationLinkDatum<GNode> {
  source: string | GNode
  target: string | GNode
}

/** Most recent N laureates, their categories and birth countries. */
function buildGraph(data: NobelData, n: number) {
  const picked = data.laureates
    .filter((l) => l.country && l.prizes.length)
    .toSorted(
      (a, b) =>
        Math.max(...b.prizes.map((p) => p.year)) -
        Math.max(...a.prizes.map((p) => p.year)),
    )
    .slice(0, n)
  const countryCount = d3.rollup(
    picked,
    (v) => v.length,
    (l) => l.country ?? '',
  )
  const nodes: GNode[] = [
    ...CATEGORIES.map((c, i) => ({
      id: `cat:${c}`,
      label: c,
      kind: 'category' as const,
      weight: 0,
      group: i,
    })),
    ...[...countryCount].map(([c, count]) => ({
      id: `country:${c}`,
      label: c,
      kind: 'country' as const,
      weight: count,
      group: -1,
    })),
    ...picked.map((l) => ({
      id: `l:${l.id}`,
      label: l.name,
      kind: 'laureate' as const,
      weight: 1,
      group: categoryIndex(l.prizes[0].category),
    })),
  ]
  const links: GLink[] = picked.flatMap((l) => [
    ...l.prizes.map((p) => ({
      source: `l:${l.id}`,
      target: `cat:${p.category}`,
    })),
    { source: `l:${l.id}`, target: `country:${l.country}` },
  ])
  return { nodes, links, picked }
}

const radius = (d: GNode) =>
  d.kind === 'category' ? 16 : d.kind === 'country' ? 4 + Math.sqrt(d.weight) * 2.2 : 3.5
const fill = (d: GNode) =>
  d.kind === 'country'
    ? 'var(--muted-foreground)'
    : d.kind === 'category'
      ? `var(--series-${d.group + 1})`
      : `color-mix(in oklab, var(--series-${d.group + 1}) 70%, var(--background))`

function ForceGraph({ data, count }: { data: NobelData; count: number }) {
  const wrap = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const { width, height } = useElementSize(wrap)
  const reduced = usePrefersReducedMotion()
  const api = useRef<{
    update: (g: ReturnType<typeof buildGraph>) => void
    reheat: () => void
  } | null>(null)
  const graph = useMemo(() => buildGraph(data, count), [data, count])

  // One-time setup: layers, zoom, simulation. Data changes go through update().
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const svg = d3.select(el)
    const root = svg.append('g')
    const linkG = root
      .append('g')
      .attr('stroke', 'var(--border)')
      .attr('stroke-opacity', 0.9)
    const nodeG = root.append('g')
    const labelG = root.append('g').attr('pointer-events', 'none')
    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 5])
        .on('zoom', (e: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          root.attr('transform', e.transform.toString())
        }),
    )

    let nodes: GNode[] = []
    let links: GLink[] = []
    const sim = d3
      .forceSimulation<GNode>()
      .force(
        'link',
        d3
          .forceLink<GNode, GLink>()
          .id((d) => d.id)
          .distance((l) => ((l.target as GNode).kind === 'category' ? 70 : 40))
          .strength(0.25),
      )
      .force(
        'charge',
        d3
          .forceManyBody<GNode>()
          .strength((d) =>
            d.kind === 'category' ? -420 : d.kind === 'country' ? -90 : -18,
          ),
      )
      .force(
        'collide',
        d3.forceCollide<GNode>((d) => radius(d) + 1.5),
      )
      .force('x', d3.forceX().strength(0.04))
      .force('y', d3.forceY().strength(0.06))

    const tip = tipRef.current
    const neighbors = new Map<string, Set<string>>()

    const ticked = () => {
      linkG
        .selectAll<SVGLineElement, GLink>('line')
        .attr('x1', (d) => (d.source as GNode).x ?? 0)
        .attr('y1', (d) => (d.source as GNode).y ?? 0)
        .attr('x2', (d) => (d.target as GNode).x ?? 0)
        .attr('y2', (d) => (d.target as GNode).y ?? 0)
      nodeG
        .selectAll<SVGCircleElement, GNode>('circle')
        .attr('cx', (d) => d.x ?? 0)
        .attr('cy', (d) => d.y ?? 0)
      labelG
        .selectAll<SVGTextElement, GNode>('text')
        .attr('x', (d) => d.x ?? 0)
        .attr('y', (d) => (d.y ?? 0) - radius(d) - 4)
    }
    sim.on('tick', ticked)

    const highlight = (d: GNode | null) => {
      const keep = d ? (neighbors.get(d.id) ?? new Set()).add(d.id) : null
      nodeG
        .selectAll<SVGCircleElement, GNode>('circle')
        .attr('opacity', (n) => (!keep || keep.has(n.id) ? 1 : 0.12))
      linkG
        .selectAll<SVGLineElement, GLink>('line')
        .attr('stroke', (l) =>
          d && ((l.source as GNode).id === d.id || (l.target as GNode).id === d.id)
            ? 'var(--page-accent)'
            : 'var(--border)',
        )
        .attr('stroke-opacity', (l) =>
          !d || (l.source as GNode).id === d.id || (l.target as GNode).id === d.id
            ? 0.9
            : 0.08,
        )
      labelG
        .selectAll<SVGTextElement, GNode>('text')
        .attr('opacity', (n) =>
          !keep
            ? n.kind === 'category'
              ? 1
              : 0
            : keep.has(n.id) && n.kind !== 'laureate'
              ? 1
              : n.id === d?.id
                ? 1
                : 0,
        )
    }

    const drag = d3
      .drag<SVGCircleElement, GNode>()
      .on('start', (e: d3.D3DragEvent<SVGCircleElement, GNode, GNode>, d) => {
        if (!e.active) sim.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (e: d3.D3DragEvent<SVGCircleElement, GNode, GNode>, d) => {
        d.fx = e.x
        d.fy = e.y
      })
      .on('end', (e: d3.D3DragEvent<SVGCircleElement, GNode, GNode>, d) => {
        if (!e.active) sim.alphaTarget(0)
        d.fx = null
        d.fy = null
      })

    api.current = {
      reheat: () => sim.alpha(0.9).restart(),
      update: (g) => {
        // Keep positions of nodes that survive the update.
        const old = new Map(nodes.map((n) => [n.id, n]))
        nodes = g.nodes.map((n) =>
          Object.assign(
            old.get(n.id) ?? {
              x: (Math.random() - 0.5) * 60,
              y: (Math.random() - 0.5) * 60,
            },
            n,
          ),
        )
        links = g.links.map((l) => ({ ...l }))
        neighbors.clear()
        for (const l of g.links) {
          const s = String(l.source)
          const t = String(l.target)
          if (!neighbors.has(s)) neighbors.set(s, new Set())
          if (!neighbors.has(t)) neighbors.set(t, new Set())
          neighbors.get(s)?.add(t)
          neighbors.get(t)?.add(s)
        }
        const t = d3.transition().duration(reduced ? 0 : 500)

        linkG
          .selectAll<SVGLineElement, GLink>('line')
          .data(
            links,
            (l) =>
              `${typeof l.source === 'string' ? l.source : l.source.id}-${typeof l.target === 'string' ? l.target : l.target.id}`,
          )
          .join(
            (enter) =>
              enter
                .append('line')
                .attr('stroke-width', 0.8)
                .attr('stroke-opacity', 0)
                .call((s) => s.transition(t).attr('stroke-opacity', 0.9)),
            (update) => update,
            (exit) => exit.transition(t).attr('stroke-opacity', 0).remove(),
          )

        nodeG
          .selectAll<SVGCircleElement, GNode>('circle')
          .data(nodes, (d) => d.id)
          .join(
            (enter) =>
              enter
                .append('circle')
                .attr('r', 0)
                .style('fill', fill)
                .attr('stroke', 'var(--card)')
                .attr('stroke-width', 1.2)
                .style('cursor', 'grab')
                .call(drag)
                .on('pointerenter', (_e: PointerEvent, d) => {
                  highlight(d)
                  if (tip) {
                    tip.textContent =
                      d.kind === 'country'
                        ? `${d.label} · ${d.weight} laureates`
                        : d.label
                    tip.style.opacity = '1'
                  }
                })
                .on('pointermove', (e: PointerEvent) => {
                  const box = wrap.current?.getBoundingClientRect()
                  if (tip && box)
                    tip.style.transform = `translate(${e.clientX - box.left + 12}px, ${e.clientY - box.top + 12}px)`
                })
                .on('pointerleave', () => {
                  highlight(null)
                  if (tip) tip.style.opacity = '0'
                })
                .call((s) => s.transition(t).attr('r', radius)),
            (update) => update.call((s) => s.transition(t).attr('r', radius)),
            (exit) => exit.transition(t).attr('r', 0).remove(),
          )

        labelG
          .selectAll<SVGTextElement, GNode>('text')
          .data(
            nodes.filter((n) => n.kind !== 'laureate'),
            (d) => d.id,
          )
          .join('text')
          .text((d) => d.label)
          .attr('text-anchor', 'middle')
          .attr('font-size', (d) => (d.kind === 'category' ? 11 : 9))
          .attr('font-weight', 600)
          .attr('fill', 'var(--foreground)')
          .attr('paint-order', 'stroke')
          .attr('stroke', 'var(--card)')
          .attr('stroke-width', 3)
          .attr('opacity', (d) => (d.kind === 'category' ? 1 : 0))

        sim.nodes(nodes)
        sim.force<d3.ForceLink<GNode, GLink>>('link')?.links(links)
        if (reduced) {
          sim.alpha(1).stop()
          sim.tick(300)
          ticked()
        } else {
          sim.alpha(0.7).restart()
        }
      },
    }
    return () => {
      sim.stop()
      svg.on('.zoom', null)
      svg.selectAll('*').interrupt().remove()
      api.current = null
    }
  }, [reduced])

  useEffect(() => {
    api.current?.update(graph)
  }, [graph, reduced])

  return (
    <div
      ref={wrap}
      className="relative h-[34rem] overflow-hidden rounded-xl bg-surface-2"
    >
      <svg
        ref={svgRef}
        viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
        className="size-full touch-none"
        role="img"
        aria-label={`Force-directed network of ${count} Nobel laureates linked to their categories and birth countries`}
      />
      <div
        ref={tipRef}
        className="pointer-events-none absolute top-0 left-0 rounded-md border bg-popover px-2 py-1 text-xs font-medium opacity-0 shadow-md transition-opacity"
      />
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-x-3 gap-y-1 rounded-lg border bg-card/80 px-3 py-2 text-[11px] backdrop-blur">
        {CATEGORIES.map((c, i) => (
          <span key={c} className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ background: `var(--series-${i + 1})` }}
            />
            {c}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-muted-foreground" /> Birth country
        </span>
      </div>
      <Button
        size="xs"
        variant="outline"
        className="absolute top-3 right-3"
        onClick={() => api.current?.reheat()}
      >
        <RotateCcw /> Reheat
      </Button>
    </div>
  )
}

const LAUREATE_COLUMNS = [
  { id: 'name', header: 'Laureate', value: (l: Laureate) => l.name },
  {
    id: 'category',
    header: 'Category',
    value: (l: Laureate) => l.prizes.map((p) => p.category).join(', '),
  },
  {
    id: 'year',
    header: 'Year',
    value: (l: Laureate) => Math.max(...l.prizes.map((p) => p.year)),
    numeric: true,
    format: (v: unknown) => String(v),
  },
  { id: 'country', header: 'Born in', value: (l: Laureate) => l.country },
  { id: 'gender', header: 'Gender', value: (l: Laureate) => l.gender },
] as const

export function ForceNetworkDemo({
  count,
  onCount,
}: {
  count: number
  onCount: (n: number) => void
}) {
  const query = useQuery(nobelQuery())
  const { source, reason } = badgeFor(query)
  const queryData = query.data
  const rows = useMemo(
    () => (queryData ? buildGraph(queryData.data, count).picked : []),
    [queryData, count],
  )
  return (
    <DemoSection
      id="force"
      index={1}
      title="Force-directed Nobel network"
      description="The most recent laureates linked to their prize categories and birth countries. d3-force lays it out; drag nodes, scroll to zoom, hover to isolate a node's neighbors. Changing the node count joins new nodes in and exits old ones with transitions while survivors keep their positions (and the count lives in the URL)."
      source={source}
      sourceReason={reason}
      sourceLabel="Nobel Prize API v2.1"
      reveal
      controls={
        <>
          <SliderControl
            label="Laureates"
            value={count}
            min={40}
            max={400}
            step={20}
            onChange={onCount}
          />
          <DataInspector
            title="Laureates in the network"
            description={`${rows.length} most recent laureates from the Nobel Prize API.`}
            rows={rows}
            columns={LAUREATE_COLUMNS}
          />
        </>
      }
    >
      <DataState
        query={query}
        isEmpty={(d) => d.laureates.length === 0}
        className="h-[34rem]"
      >
        {(data) => <ForceGraph data={data} count={count} />}
      </DataState>
    </DemoSection>
  )
}
