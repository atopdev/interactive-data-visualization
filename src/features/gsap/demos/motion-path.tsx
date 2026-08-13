import { Rocket } from 'lucide-react'
import { useRef, useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { gsap, MOTION_OK, NO_MOTION, useGSAP } from '../gsap'

const PATH =
  'M 40 60 C 220 0 380 140 300 240 S 60 300 120 420 S 520 470 560 360 S 420 160 620 120 S 840 260 760 420 S 600 560 820 580'

const STOPS = [
  { x: 40, y: 60, label: 'Launch' },
  { x: 300, y: 240, label: 'Orbit' },
  { x: 560, y: 360, label: 'Slingshot' },
  { x: 760, y: 420, label: 'Drift' },
  { x: 820, y: 580, label: 'Landing' },
]

export function MotionPathDemo() {
  const scope = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: scope.current,
            start: 'top 70%',
            end: 'bottom 40%',
            scrub: 0.6,
            onUpdate: (self) => setProgress(self.progress),
          },
        })
        tl.fromTo('[data-trail]', { drawSVG: '0%' }, { drawSVG: '100%' }, 0).to(
          '[data-rocket]',
          {
            motionPath: {
              path: '[data-route]',
              align: '[data-route]',
              alignOrigin: [0.5, 0.5],
              autoRotate: 45,
            },
          },
          0,
        )
      })
      mm.add(NO_MOTION, () => {
        gsap.set('[data-trail]', { drawSVG: '100%' })
        gsap.set('[data-rocket]', {
          motionPath: {
            path: '[data-route]',
            align: '[data-route]',
            alignOrigin: [0.5, 0.5],
            end: 1,
          },
        })
      })
      return () => mm.revert()
    },
    { scope },
  )

  return (
    <DemoSection
      id="motion-path"
      index={4}
      title="MotionPath scrubbed on scroll"
      description="MotionPathPlugin moves the rocket along an SVG path with auto-rotation, while DrawSVG reveals the trail behind it. Both tweens share one timeline whose playhead is scrubbed by scroll position."
      source="generated"
      sourceLabel="SVG path"
    >
      <div
        ref={scope}
        className="bg-dot-grid relative overflow-hidden rounded-xl bg-surface-2"
      >
        <svg
          viewBox="0 0 860 640"
          className="h-auto w-full"
          role="img"
          aria-label="Rocket traveling along a winding path as you scroll"
        >
          <path
            data-route
            d={PATH}
            fill="none"
            stroke="var(--border)"
            strokeWidth={2}
            strokeDasharray="6 10"
          />
          <path
            data-trail
            d={PATH}
            fill="none"
            stroke="var(--page-accent)"
            strokeWidth={4}
            strokeLinecap="round"
          />
          {STOPS.map((s, i) => (
            <g key={s.label} transform={`translate(${s.x} ${s.y})`}>
              <circle
                r={9}
                fill={
                  progress >= i / (STOPS.length - 1) - 0.02
                    ? 'var(--page-accent)'
                    : 'var(--card)'
                }
                stroke="var(--page-accent)"
                strokeWidth={3}
              />
              <text
                y={-18}
                textAnchor="middle"
                className="fill-muted-foreground text-[15px] font-medium"
              >
                {s.label}
              </text>
            </g>
          ))}
        </svg>
        <div
          data-rocket
          className="absolute top-0 left-0 grid size-11 place-items-center rounded-full bg-foreground text-background shadow-lg"
          aria-hidden
        >
          <Rocket className="size-5" />
        </div>
        <div className="absolute right-4 bottom-4 rounded-lg border bg-card/80 px-3 py-1.5 font-mono text-xs backdrop-blur">
          progress {(progress * 100).toFixed(0)}%
        </div>
      </div>
    </DemoSection>
  )
}
