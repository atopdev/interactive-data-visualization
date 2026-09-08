import * as d3 from 'd3'
import { useEffect, useRef, useState } from 'react'
import { SliderControl } from '@/components/page/control'
import { DemoSection } from '@/components/page/demo-section'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { useElementSize } from '@/hooks/use-element-size'
import { useInView } from '@/hooks/use-in-view'
import { usePageVisible } from '@/hooks/use-page-visible'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { alpha } from '@/lib/colors'
import { seededRandom } from '@/lib/random'

type Mode = 'voronoi' | 'delaunay'
const H = 420

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  group: number
}

export function VoronoiDemo() {
  const wrap = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { width } = useElementSize(wrap)
  const inView = useInView(wrap)
  const visible = usePageVisible()
  const reduced = usePrefersReducedMotion()
  const theme = useChartTheme()
  const [count, setCount] = useState(180)
  const [mode, setMode] = useState<Mode>('voronoi')
  const pointer = useRef<[number, number] | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || width === 0) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * dpr
    canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const rand = seededRandom(`voronoi-${count}`)
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: rand() * width,
      y: rand() * H,
      vx: (rand() - 0.5) * 0.6,
      vy: (rand() - 0.5) * 0.6,
      group: Math.floor(rand() * 4),
    }))

    const draw = () => {
      const delaunay = d3.Delaunay.from(
        particles,
        (p) => p.x,
        (p) => p.y,
      )
      const voronoi = delaunay.voronoi([0, 0, width, H])
      const hover = pointer.current
        ? delaunay.find(pointer.current[0], pointer.current[1])
        : -1
      ctx.clearRect(0, 0, width, H)
      if (mode === 'voronoi') {
        // Fill each cell faintly by group; highlight the hovered cell and its neighbors.
        const neighbors = new Set(hover >= 0 ? delaunay.neighbors(hover) : [])
        for (let i = 0; i < particles.length; i++) {
          ctx.beginPath()
          voronoi.renderCell(i, ctx)
          const base = theme.series[particles[i].group]
          ctx.fillStyle =
            i === hover
              ? alpha(base, 0.55)
              : neighbors.has(i)
                ? alpha(base, 0.28)
                : alpha(base, 0.07)
          ctx.fill()
        }
        ctx.beginPath()
        voronoi.render(ctx)
        ctx.strokeStyle = alpha(theme.muted, 0.35)
        ctx.lineWidth = 0.8
        ctx.stroke()
      } else {
        ctx.beginPath()
        delaunay.render(ctx)
        ctx.strokeStyle = alpha(theme.accent, 0.35)
        ctx.lineWidth = 0.8
        ctx.stroke()
        if (hover >= 0) {
          ctx.beginPath()
          for (const j of delaunay.neighbors(hover)) {
            ctx.moveTo(particles[hover].x, particles[hover].y)
            ctx.lineTo(particles[j].x, particles[j].y)
          }
          ctx.strokeStyle = theme.accent
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        ctx.beginPath()
        ctx.arc(p.x, p.y, i === hover ? 4 : 2, 0, Math.PI * 2)
        ctx.fillStyle = theme.series[p.group]
        ctx.fill()
      }
    }

    const step = () => {
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
        // Gently repel particles from the pointer.
        if (pointer.current) {
          const dx = p.x - pointer.current[0]
          const dy = p.y - pointer.current[1]
          const d2 = dx * dx + dy * dy
          if (d2 < 6400) {
            p.vx += (dx / Math.sqrt(d2 + 1)) * 0.05
            p.vy += (dy / Math.sqrt(d2 + 1)) * 0.05
          }
        }
        p.vx = Math.max(-1.2, Math.min(1.2, p.vx * 0.995))
        p.vy = Math.max(-1.2, Math.min(1.2, p.vy * 0.995))
      }
    }

    draw()
    // Animate only while visible; reduced motion keeps a static (still hoverable) field.
    const timer =
      inView && visible && !reduced
        ? d3.timer(() => {
            step()
            draw()
          })
        : null
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      pointer.current = [e.clientX - r.left, e.clientY - r.top]
      if (!timer) draw()
    }
    const onLeave = () => {
      pointer.current = null
      if (!timer) draw()
    }
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
    return () => {
      timer?.stop()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [width, count, mode, inView, visible, reduced, theme])

  return (
    <DemoSection
      id="voronoi"
      index={8}
      title="Voronoi / Delaunay particle field"
      description="Drifting particles are re-triangulated every frame with d3-delaunay (Delaunator under the hood) and drawn to canvas. Hover to highlight a cell and its Delaunay neighbors (the pointer also nudges particles away). Switch between the Voronoi diagram and its dual triangulation."
      source="generated"
      sourceLabel="Seeded random particles"
      controls={
        <>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={mode}
            onValueChange={(v) => v && setMode(v as Mode)}
          >
            <ToggleGroupItem value="voronoi">Voronoi</ToggleGroupItem>
            <ToggleGroupItem value="delaunay">Delaunay</ToggleGroupItem>
          </ToggleGroup>
          <SliderControl
            label="Particles"
            value={count}
            min={40}
            max={600}
            step={20}
            onChange={setCount}
          />
        </>
      }
    >
      <div ref={wrap} className="overflow-hidden rounded-xl bg-surface-2">
        <canvas
          ref={canvasRef}
          style={{ width, height: H }}
          className="block"
          role="img"
          aria-label={`Animated ${mode} diagram of ${count} particles`}
        />
      </div>
    </DemoSection>
  )
}
