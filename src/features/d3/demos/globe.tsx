import { useQuery } from '@tanstack/react-query'
import * as d3 from 'd3'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DataInspector, type InspectorColumn } from '@/components/data-inspector'
import { SliderControl, SwitchControl } from '@/components/page/control'
import { DataState } from '@/components/page/data-state'
import { DemoSection } from '@/components/page/demo-section'
import { useChartTheme } from '@/hooks/use-chart-theme'
import { useElementSize } from '@/hooks/use-element-size'
import { useInView } from '@/hooks/use-in-view'
import { usePageVisible } from '@/hooks/use-page-visible'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { badgeFor } from '@/lib/badge'
import { alpha } from '@/lib/colors'
import { borders, countries, owidName } from '@/lib/geo'
import type { OwidTable } from '@/lib/sources/owid'
import type { Quake } from '@/lib/sources/usgs'
import { owidQuery, quakesQuery } from '../queries'

interface GlobeProps {
  table: OwidTable
  year: number
  points: Quake[] | null
  spin: boolean
}

function Globe({ table, year, points, spin }: GlobeProps) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const { width } = useElementSize(wrap)
  const inView = useInView(wrap)
  const visible = usePageVisible()
  const reduced = usePrefersReducedMotion()
  const theme = useChartTheme()
  const rotation = useRef<[number, number, number]>([-10, -20, 0])
  const size = Math.min(width, 560)

  // Value per world-atlas feature for the selected year.
  const values = useMemo(() => {
    const yi = table.years.indexOf(year)
    const byName = new Map(table.series.map((s) => [s.entity, s.values[yi]]))
    return new Map(countries.features.map((f) => [f, byName.get(owidName(f)) ?? null]))
  }, [table, year])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || size === 0) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const projection = d3
      .geoOrthographic()
      .fitExtent(
        [
          [8, 8],
          [size - 8, size - 8],
        ],
        { type: 'Sphere' },
      )
      .rotate(rotation.current)
    const path = d3.geoPath(projection, ctx)
    const graticule = d3.geoGraticule10()
    const all = [...values.values()].filter((v): v is number => v !== null && v > 0)
    const [lo, hi] = [d3.quantile(all, 0.02) ?? 0.05, d3.quantile(all, 0.98) ?? 20]
    const t01 = d3
      .scaleLog()
      .domain([Math.max(0.01, lo), hi])
      .range([0, 1])
      .clamp(true)
    const ramp = d3.interpolateRgbBasis(theme.seq)
    const mags = points ?? []

    const draw = (time: number) => {
      ctx.clearRect(0, 0, size, size)
      ctx.beginPath()
      path({ type: 'Sphere' })
      ctx.fillStyle = alpha(theme.series[0], 0.08)
      ctx.fill()
      ctx.beginPath()
      path(graticule)
      ctx.strokeStyle = theme.grid
      ctx.lineWidth = 0.6
      ctx.stroke()
      for (const [f, v] of values) {
        ctx.beginPath()
        path(f)
        ctx.fillStyle = v === null ? alpha(theme.muted, 0.25) : ramp(t01(v))
        ctx.fill()
      }
      ctx.beginPath()
      path(borders)
      ctx.strokeStyle = alpha(theme.background, 0.7)
      ctx.lineWidth = 0.5
      ctx.stroke()
      // Earthquakes on the visible hemisphere; radius pulses with magnitude.
      const [lambda, phi] = projection.rotate()
      const center: [number, number] = [-lambda, -phi]
      for (const q of mags) {
        if (d3.geoDistance([q.lon, q.lat], center) > Math.PI / 2) continue
        const p = projection([q.lon, q.lat])
        if (!p) continue
        const base = Math.max(1.2, (q.mag - 1) * 1.4)
        const pulse = reduced ? 0 : (Math.sin(time / 400 + q.lon) + 1) * 0.5
        ctx.beginPath()
        ctx.arc(p[0], p[1], base + pulse * base * 1.6, 0, Math.PI * 2)
        ctx.fillStyle = alpha(theme.series[7], 0.15 + (1 - pulse) * 0.25)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(p[0], p[1], base * 0.6, 0, Math.PI * 2)
        ctx.fillStyle = theme.series[7]
        ctx.fill()
      }
      ctx.beginPath()
      path({ type: 'Sphere' })
      ctx.strokeStyle = theme.border
      ctx.lineWidth = 1
      ctx.stroke()
    }

    let dragging = false
    const animate = spin && inView && visible && !reduced
    const timer = d3.timer((elapsed) => {
      if (animate && !dragging) {
        const r = projection.rotate()
        projection.rotate([r[0] + 0.12, r[1], r[2]])
        rotation.current = projection.rotate()
      }
      draw(elapsed)
    })
    if (!inView || !visible) {
      timer.stop()
      draw(0)
    }

    const sel = d3.select(canvas)
    sel.call(
      d3
        .drag<HTMLCanvasElement, unknown>()
        .on('start', () => {
          dragging = true
        })
        .on('drag', (e: d3.D3DragEvent<HTMLCanvasElement, unknown, unknown>) => {
          const r = projection.rotate()
          const k = 75 / projection.scale()
          projection.rotate([
            r[0] + e.dx * k,
            Math.max(-90, Math.min(90, r[1] - e.dy * k)),
            r[2],
          ])
          rotation.current = projection.rotate()
          if (!inView || !visible) draw(0)
        })
        .on('end', () => {
          dragging = false
        }),
    )
    const tip = tipRef.current
    sel.on('pointermove', (e: PointerEvent) => {
      if (!tip) return
      const [mx, my] = d3.pointer(e)
      const ll = projection.invert?.([mx, my])
      const hit = ll ? countries.features.find((f) => d3.geoContains(f, ll)) : undefined
      if (!hit) {
        tip.style.opacity = '0'
        return
      }
      const v = values.get(hit)
      tip.textContent = `${owidName(hit)} · ${v == null ? 'no data' : `${v.toFixed(2)} t CO₂ per person`}`
      tip.style.opacity = '1'
      tip.style.transform = `translate(${mx + 14}px, ${my + 14}px)`
    })
    sel.on('pointerleave', () => {
      if (tip) tip.style.opacity = '0'
    })
    return () => {
      timer.stop()
      sel.on('.drag', null).on('pointermove', null).on('pointerleave', null)
    }
  }, [size, values, points, spin, inView, visible, reduced, theme])

  return (
    <div ref={wrap} className="relative flex w-full justify-center">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="cursor-grab touch-none active:cursor-grabbing"
        role="img"
        aria-label={`Globe colored by CO2 emissions per capita in ${year}${points ? ', with this week’s earthquakes' : ''}`}
      />
      <div
        ref={tipRef}
        className="pointer-events-none absolute top-0 left-0 rounded-md border bg-popover px-2 py-1 text-xs font-medium opacity-0 shadow-md"
      />
    </div>
  )
}

function Legend() {
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span>low</span>
      <span
        className="h-2 w-40 rounded-full"
        style={{
          background:
            'linear-gradient(90deg, var(--seq-100), var(--seq-300), var(--seq-500), var(--seq-700))',
        }}
      />
      <span>high (log scale, t CO₂/person)</span>
      <span className="ml-3 flex items-center gap-1">
        <span className="size-2 rounded-full" style={{ background: 'var(--series-8)' }} />{' '}
        earthquake
      </span>
    </div>
  )
}

export function GlobeDemo() {
  const co2 = useQuery(owidQuery('co-emissions-per-capita'))
  const quakes = useQuery(quakesQuery())
  const [showQuakes, setShowQuakes] = useState(true)
  const [spin, setSpin] = useState(true)
  const years = co2.data?.data.years ?? []
  const [year, setYear] = useState<number | null>(null)
  const current = year ?? years.at(-1) ?? 2020
  const { source, reason } = badgeFor(co2, quakes)

  const co2Data = co2.data
  const rows = useMemo(() => {
    const t = co2Data?.data
    if (!t) return []
    const yi = t.years.indexOf(current)
    return t.series.map((s) => ({ entity: s.entity, value: s.values[yi] }))
  }, [co2Data, current])
  const columns: InspectorColumn<(typeof rows)[number]>[] = [
    { id: 'entity', header: 'Country', value: (r) => r.entity },
    {
      id: 'value',
      header: `t CO₂ per person (${current})`,
      value: (r) => r.value,
      numeric: true,
    },
  ]

  return (
    <DemoSection
      id="globe"
      index={4}
      title="Orthographic globe: CO₂ choropleth + earthquakes"
      description="d3-geo projects the bundled world-atlas shapes onto a canvas-rendered orthographic globe. Drag to rotate (it auto-spins otherwise), hover a country for its value, scrub the year, and toggle this week's USGS earthquakes pulsing by magnitude. Rendering pauses when the globe is off-screen."
      source={source}
      sourceReason={reason}
      sourceLabel="Our World in Data + USGS"
      controls={
        <>
          <SliderControl
            label="Year"
            value={current}
            min={years[0] ?? 1960}
            max={years.at(-1) ?? 2023}
            onChange={setYear}
          />
          <SwitchControl
            label="Earthquakes"
            checked={showQuakes}
            onChange={setShowQuakes}
          />
          <SwitchControl label="Auto-spin" checked={spin} onChange={setSpin} />
          <DataInspector
            title={`CO₂ emissions per capita, ${current}`}
            description="Our World in Data, tonnes of CO₂ per person."
            rows={rows}
            columns={columns}
          />
        </>
      }
    >
      <div className="flex flex-col items-center gap-3">
        <DataState query={co2} className="h-[35rem] w-full">
          {(table) => (
            <Globe
              table={table}
              year={current}
              points={showQuakes ? (quakes.data?.data.quakes ?? null) : null}
              spin={spin}
            />
          )}
        </DataState>
        <Legend />
      </div>
    </DemoSection>
  )
}
