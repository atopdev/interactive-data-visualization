import {
  forceCollide,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  select,
  type SimulationNodeDatum,
} from 'd3'
import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { seededRandom } from '@/lib/random'

interface Node extends SimulationNodeDatum {
  r: number
  group: number
}

/** Mini force layout: clusters that periodically regroup around new centers. */
export default function D3Preview() {
  const svgRef = useRef<SVGSVGElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const w = 320
    const h = 200
    const rand = seededRandom('landing-d3')
    const nodes: Node[] = Array.from({ length: 46 }, (_, i) => ({
      r: 3 + rand() * 7,
      group: i % 4,
      x: w / 2 + (rand() - 0.5) * 40,
      y: h / 2 + (rand() - 0.5) * 40,
    }))
    const layouts = [
      [
        [0.3, 0.35],
        [0.7, 0.35],
        [0.3, 0.7],
        [0.7, 0.7],
      ],
      [
        [0.5, 0.5],
        [0.5, 0.5],
        [0.5, 0.5],
        [0.5, 0.5],
      ],
      [
        [0.15, 0.5],
        [0.4, 0.5],
        [0.62, 0.5],
        [0.85, 0.5],
      ],
    ]
    let layout = 0
    const circles = select(svg)
      .selectAll<SVGCircleElement, Node>('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d) => d.r)
      .attr('fill', (d) => `var(--series-${d.group + 1})`)
      .attr('fill-opacity', 0.85)

    const fx = forceX<Node>((d) => layouts[layout][d.group][0] * w).strength(0.08)
    const fy = forceY<Node>((d) => layouts[layout][d.group][1] * h).strength(0.08)
    const sim = forceSimulation(nodes)
      .force('charge', forceManyBody().strength(-6))
      .force(
        'collide',
        forceCollide<Node>((d) => d.r + 1.2),
      )
      .force('x', fx)
      .force('y', fy)
      .on('tick', () => circles.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0))

    if (reduced) {
      sim.stop()
      sim.tick(200)
      circles.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0)
      return
    }
    const id = window.setInterval(() => {
      layout = (layout + 1) % layouts.length
      fx.x((d) => layouts[layout][d.group][0] * w)
      fy.y((d) => layouts[layout][d.group][1] * h)
      sim.alpha(0.8).restart()
    }, 2600)
    return () => {
      window.clearInterval(id)
      sim.stop()
    }
  }, [reduced])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 320 200"
      className="size-full"
      role="img"
      aria-label="Animated force-directed clusters"
    />
  )
}
