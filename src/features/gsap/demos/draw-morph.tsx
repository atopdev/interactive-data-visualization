import { Pause, Play, RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { Button } from '@/components/ui/button'
import { seededRandom } from '@/lib/fake'
import { gsap, MOTION_OK, useGSAP } from '../gsap'

function starPath(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  points = 5,
) {
  const step = Math.PI / points
  const pts = Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner
    const a = i * step - Math.PI / 2
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  })
  return `M${pts.join(' L')} Z`
}

function blobPath(seed: string, cx = 100, cy = 100, r = 70, n = 8) {
  const rand = seededRandom(seed)
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const rr = r * (0.75 + rand() * 0.45)
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)] as const
  })
  // Closed Catmull-Rom spline converted to cubic Béziers.
  const d = pts.map((p, i) => {
    const p0 = pts[(i - 1 + n) % n]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    const c1 = [p[0] + (p2[0] - p0[0]) / 6, p[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p[0]) / 6, p2[1] - (p3[1] - p[1]) / 6]
    return `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  })
  return `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)} ${d.join(' ')} Z`
}

const SHAPES = [
  { name: 'Circle', d: 'M100,25 A75,75 0 1,1 99.9,25 Z' },
  { name: 'Star', d: starPath(100, 105, 82, 36) },
  {
    name: 'Heart',
    d: 'M100,172 C40,126 14,96 14,64 C14,36 36,20 60,20 C80,20 94,32 100,46 C106,32 120,20 140,20 C164,20 186,36 186,64 C186,96 160,126 100,172 Z',
  },
  { name: 'Blob', d: blobPath('gsap-morph-blob') },
  { name: 'Hexagon', d: starPath(100, 100, 80, 80 * Math.cos(Math.PI / 6), 3) },
]

function spiral(cx: number, cy: number, turns: number, spacing: number) {
  const pts: string[] = []
  for (let t = 0; t <= turns * Math.PI * 2; t += 0.15) {
    const r = spacing * t
    pts.push(
      `${(cx + r * Math.cos(t)).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`,
    )
  }
  return `M${pts.join(' L')}`
}

function wave(y: number, amp: number, freq: number, width = 300) {
  const pts: string[] = []
  for (let x = 0; x <= width; x += 4) {
    pts.push(
      `${x},${(y + Math.sin((x / width) * Math.PI * 2 * freq) * amp).toFixed(1)}`,
    )
  }
  return `M${pts.join(' L')}`
}

const STROKES = [
  { d: spiral(80, 100, 3.2, 3.6), color: 'var(--series-1)' },
  { d: wave(60, 22, 2.5), color: 'var(--series-2)' },
  { d: wave(110, 30, 1.5), color: 'var(--series-3)' },
  { d: wave(160, 14, 4), color: 'var(--series-5)' },
]

export function DrawMorphDemo() {
  const scope = useRef<HTMLDivElement>(null)
  const drawTl = useRef<gsap.core.Timeline | null>(null)
  const morphTl = useRef<gsap.core.Timeline | null>(null)
  const [playing, setPlaying] = useState(true)
  const [shape, setShape] = useState(0)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        drawTl.current = gsap
          .timeline({ repeat: -1, repeatDelay: 0.6, yoyo: true })
          .fromTo(
            '[data-draw]',
            { drawSVG: '0% 0%' },
            {
              drawSVG: '0% 100%',
              duration: 1.8,
              ease: 'power2.inOut',
              stagger: 0.25,
            },
          )
          .to(
            '[data-draw]',
            {
              drawSVG: '100% 100%',
              duration: 1.2,
              ease: 'power2.in',
              stagger: 0.15,
            },
            '+=0.4',
          )

        const tl = gsap.timeline({
          repeat: -1,
          defaults: { duration: 1.1, ease: 'expo.inOut' },
        })
        SHAPES.slice(1)
          .concat(SHAPES[0])
          .forEach((s, i) => {
            tl.to(
              '[data-morph]',
              {
                morphSVG: { shape: s.d, type: 'rotational' },
                onStart: () => setShape((i + 1) % SHAPES.length),
              },
              `+=0.7`,
            )
          })
        morphTl.current = tl
      })
      return () => mm.revert()
    },
    { scope },
  )

  const toggle = () => {
    const next = !playing
    setPlaying(next)
    drawTl.current?.paused(!next)
    morphTl.current?.paused(!next)
  }

  const restart = () => {
    drawTl.current?.restart()
    morphTl.current?.restart()
    setShape(0)
    setPlaying(true)
  }

  return (
    <DemoSection
      id="draw-morph"
      index={3}
      title="DrawSVG + MorphSVG"
      description="DrawSVG animates the visible segment of each stroke (drawing on and then off again), while MorphSVG tweens a single path between five shapes with different point counts using rotational interpolation."
      source="generated"
      sourceLabel="Procedural SVG paths"
      controls={
        <>
          <Button variant="outline" size="sm" onClick={toggle}>
            {playing ? <Pause /> : <Play />} {playing ? 'Pause' : 'Play'}
          </Button>
          <Button variant="outline" size="sm" onClick={restart}>
            <RotateCcw /> Restart
          </Button>
        </>
      }
    >
      <div ref={scope} className="grid gap-4 md:grid-cols-2">
        <div className="bg-dot-grid rounded-xl bg-surface-2 p-4">
          <svg
            viewBox="0 0 300 200"
            className="h-64 w-full"
            role="img"
            aria-label="Strokes drawing on and off"
          >
            {STROKES.map((s, i) => (
              <path
                key={i}
                data-draw
                d={s.d}
                fill="none"
                stroke={s.color}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>
          <p className="text-center font-mono text-xs text-muted-foreground">
            drawSVG: &quot;0% 100%&quot;
          </p>
        </div>
        <div className="bg-dot-grid relative rounded-xl bg-surface-2 p-4">
          <svg
            viewBox="0 0 200 200"
            className="h-64 w-full"
            role="img"
            aria-label={`Morphing shape: ${SHAPES[shape].name}`}
          >
            <defs>
              <linearGradient id="morph-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--page-accent)" />
                <stop offset="100%" stopColor="var(--series-7)" />
              </linearGradient>
            </defs>
            <path data-morph d={SHAPES[0].d} fill="url(#morph-grad)" />
          </svg>
          <p className="text-center font-mono text-xs text-muted-foreground">
            morphSVG →{' '}
            <span className="text-foreground">{SHAPES[shape].name}</span>
          </p>
        </div>
      </div>
    </DemoSection>
  )
}
