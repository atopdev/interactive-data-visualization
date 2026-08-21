import {
  animated,
  useChain,
  useSpring,
  useSpringRef,
  useTransition,
} from '@react-spring/web'
import { useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { fakeWith } from '@/lib/fake'

const TILES = fakeWith('spring-chain', (f) =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i,
    label: f.commerce.department(),
    value: f.number.int({ min: 12, max: 99 }),
  })),
)

export function ChainDemo() {
  const reduced = usePrefersReducedMotion()
  const [open, setOpen] = useState(false)

  const boxRef = useSpringRef()
  const box = useSpring({
    ref: boxRef,
    from: { size: 22, radius: 999 },
    to: { size: open ? 100 : 22, radius: open ? 16 : 999 },
    config: { tension: 220, friction: 26 },
    immediate: reduced,
  })

  const tilesRef = useSpringRef()
  const tiles = useTransition(open ? TILES : [], {
    ref: tilesRef,
    keys: (t) => t.id,
    trail: 400 / TILES.length,
    from: { opacity: 0, scale: 0 },
    enter: { opacity: 1, scale: 1 },
    leave: { opacity: 0, scale: 0 },
    immediate: reduced,
  })

  // Opening: container first, then tiles. Closing: tiles first, then container.
  useChain(open ? [boxRef, tilesRef] : [tilesRef, boxRef], [0, open ? 0.15 : 0.5])

  return (
    <DemoSection
      id="chain"
      index={4}
      title="useChain sequencing"
      description="Two independent animations (the container's size and a trailing tile transition) are given refs and sequenced with useChain. The order and timing flip depending on direction, so the grid unfolds from the button and folds back into it."
      source="generated"
      sourceLabel="Faker departments"
    >
      <div className="bg-dot-grid grid h-[26rem] place-items-center rounded-xl bg-surface-2 p-4">
        <animated.div
          role="button"
          tabIndex={0}
          aria-expanded={open}
          aria-label={open ? 'Close grid' : 'Open grid'}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen((o) => !o)}
          className="grid cursor-pointer grid-cols-3 grid-rows-4 gap-2.5 overflow-hidden bg-card p-3 shadow-xl sm:grid-cols-4 sm:grid-rows-3"
          style={{
            width: box.size.to((s) => `${s}%`),
            height: box.size.to((s) => `${s}%`),
            borderRadius: box.radius,
            border: '1px solid var(--border)',
          }}
        >
          {tiles((style, t) => (
            <animated.div
              style={{ ...style, background: `var(--series-${(t.id % 8) + 1})` }}
              className="flex min-h-0 flex-col justify-between rounded-lg p-2 text-white"
            >
              <span className="truncate text-[11px] font-medium opacity-90">
                {t.label}
              </span>
              <span className="text-lg font-semibold tabular-nums">{t.value}</span>
            </animated.div>
          ))}
        </animated.div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Click the card to open or close it
      </p>
    </DemoSection>
  )
}
