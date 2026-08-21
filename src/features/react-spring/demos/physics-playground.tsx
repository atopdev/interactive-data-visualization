import { animated, config as presets, useSpring, useSprings } from '@react-spring/web'
import { ArrowLeftRight } from 'lucide-react'
import { useState } from 'react'
import { SliderControl } from '@/components/page/control'
import { DemoSection } from '@/components/page/demo-section'
import { Button } from '@/components/ui/button'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'

const PRESETS = ['default', 'gentle', 'wobbly', 'stiff', 'slow', 'molasses'] as const

export function PhysicsPlaygroundDemo() {
  const reduced = usePrefersReducedMotion()
  const [tension, setTension] = useState(170)
  const [friction, setFriction] = useState(12)
  const [mass, setMass] = useState(1)
  const [side, setSide] = useState(false)

  // Custom spring: the ball follows the toggle with the slider physics.
  const ball = useSpring({
    x: side ? 1 : 0,
    config: { tension, friction, mass },
    immediate: reduced,
  })

  // One spring per preset, all racing to the same target.
  const [races] = useSprings(
    PRESETS.length,
    (i) => ({ x: side ? 1 : 0, config: presets[PRESETS[i]], immediate: reduced }),
    [side, reduced],
  )

  return (
    <DemoSection
      id="physics"
      index={1}
      title="Physics playground"
      description="Springs have no duration: motion emerges from tension (stiffness), friction (damping) and mass. Tune the custom spring with the sliders, then compare the six built-in presets racing to the same target. Low friction overshoots, high mass is sluggish, molasses barely moves."
      source="generated"
      reveal
      controls={
        <>
          <SliderControl
            label="tension"
            value={tension}
            min={10}
            max={500}
            onChange={setTension}
          />
          <SliderControl
            label="friction"
            value={friction}
            min={1}
            max={80}
            onChange={setFriction}
          />
          <SliderControl
            label="mass"
            value={mass}
            min={0.1}
            max={10}
            step={0.1}
            onChange={setMass}
            format={(v) => v.toFixed(1)}
          />
          <Button size="sm" onClick={() => setSide((s) => !s)}>
            <ArrowLeftRight /> Toggle
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="relative h-24 rounded-xl bg-surface-2 px-8">
          <div className="absolute inset-x-8 top-1/2 h-px bg-border" />
          <animated.div
            className="absolute top-1/2 size-14 -translate-y-1/2 rounded-full bg-page-accent shadow-lg"
            style={{
              left: ball.x.to((x) => `calc(2rem + ${x} * (100% - 4rem - 3.5rem))`),
              scale: ball.x.to([0, 0.5, 1], [1, 1.25, 1]),
            }}
          />
        </div>
        <div className="flex flex-col gap-2.5 rounded-xl bg-surface-2 p-4">
          {races.map((style, i) => (
            <div key={PRESETS[i]} className="flex items-center gap-3">
              <span className="w-20 shrink-0 font-mono text-xs text-muted-foreground">
                {PRESETS[i]}
              </span>
              <div className="relative h-6 flex-1 rounded-full bg-muted">
                <animated.span
                  className="absolute top-0.5 size-5 rounded-full"
                  style={{
                    background: `var(--series-${i + 1})`,
                    left: style.x.to((x) => `calc(0.125rem + ${x} * (100% - 1.5rem))`),
                  }}
                />
              </div>
              <span className="hidden w-32 shrink-0 font-mono text-[11px] text-muted-foreground sm:block">
                t{presets[PRESETS[i]].tension} f{presets[PRESETS[i]].friction}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DemoSection>
  )
}
