import { animated, useTrail } from '@react-spring/web'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { Button } from '@/components/ui/button'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { fakeWith } from '@/lib/fake'

const WORDS = ['Springs', 'all', 'the', 'way', 'down']
const LIST = fakeWith('spring-trail', (f) =>
  Array.from({ length: 6 }, () => ({
    name: f.commerce.productName(),
    meta: `${f.commerce.department()} · ${f.commerce.price({ symbol: '$' })}`,
  })),
)

export function TrailDemo() {
  const reduced = usePrefersReducedMotion()
  const [open, setOpen] = useState(true)

  // Each item's spring follows the previous one: a natural stagger.
  const words = useTrail(WORDS.length, {
    opacity: open ? 1 : 0,
    y: open ? 0 : 40,
    height: open ? 72 : 0,
    config: { mass: 5, tension: 2000, friction: 200 },
    immediate: reduced,
  })
  const items = useTrail(LIST.length, {
    opacity: open ? 1 : 0,
    x: open ? 0 : -24,
    delay: open ? 200 : 0,
    config: { tension: 280, friction: 24 },
    immediate: reduced,
  })

  return (
    <DemoSection
      id="trail"
      index={2}
      title="useTrail staggered entrance"
      description="useTrail creates springs that follow one another, so each element starts once the previous one is under way. No delays to tune: the stagger falls out of the physics. Toggle to see it run in reverse."
      source="generated"
      sourceLabel="Faker products"
      controls={
        <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
          {open ? <EyeOff /> : <Eye />} {open ? 'Hide' : 'Show'}
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex min-h-80 flex-col justify-center rounded-xl bg-surface-2 px-6">
          {words.map(({ height, ...style }, i) => (
            <animated.div key={WORDS[i]} style={style} className="overflow-hidden">
              <animated.p
                style={{ height }}
                className="text-5xl leading-[72px] font-semibold tracking-tight sm:text-6xl"
              >
                {WORDS[i]}
              </animated.p>
            </animated.div>
          ))}
        </div>
        <ul className="flex flex-col gap-2 rounded-xl bg-surface-2 p-4">
          {items.map((style, i) => (
            <animated.li
              key={LIST[i].name + i}
              style={style}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <span
                className="size-8 shrink-0 rounded-md"
                style={{ background: `var(--series-${i + 1})` }}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{LIST[i].name}</p>
                <p className="truncate text-xs text-muted-foreground">{LIST[i].meta}</p>
              </div>
            </animated.li>
          ))}
        </ul>
      </div>
    </DemoSection>
  )
}
