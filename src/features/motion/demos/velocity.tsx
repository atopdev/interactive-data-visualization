import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from 'motion/react'
import { useRef } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { fakeWith } from '@/lib/fake'

const COMPANIES = fakeWith('motion-marquee', (f) =>
  Array.from({ length: 12 }, () => f.company.name()),
)

function Marquee({
  baseVelocity,
  items,
}: {
  baseVelocity: number
  items: string[]
}) {
  const reduced = usePrefersReducedMotion()
  const x = useMotionValue(0)
  const { scrollY } = useScroll()
  // Scroll speed (px/s) -> smoothed -> a multiplier and a skew angle.
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  })
  const factor = useTransform(smoothVelocity, [-2000, 0, 2000], [-5, 0, 5], {
    clamp: false,
  })
  const skewX = useTransform(smoothVelocity, [-2000, 2000], [18, -18])
  const direction = useRef(1)
  const translate = useTransform(x, (v) => `${wrap(-50, 0, v)}%`)

  useAnimationFrame((_, delta) => {
    if (reduced) return
    const f = factor.get()
    if (f < 0) direction.current = -1
    else if (f > 0) direction.current = 1
    const move =
      direction.current * baseVelocity * (delta / 1000) * (1 + Math.abs(f))
    x.set(x.get() + move)
  })

  return (
    <div className="overflow-hidden py-2 whitespace-nowrap">
      <motion.div className="flex w-max gap-10" style={{ x: translate, skewX }}>
        {[...items, ...items].map((name, i) => (
          <span
            key={i}
            className="text-4xl font-semibold tracking-tight text-foreground/80 sm:text-6xl"
          >
            {name}
            <span className="ml-10 text-page-accent">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}

function CursorBlob() {
  const area = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(-100)
  const my = useMotionValue(-100)
  const x = useSpring(mx, { stiffness: 300, damping: 28, mass: 0.6 })
  const y = useSpring(my, { stiffness: 300, damping: 28, mass: 0.6 })
  const vx = useVelocity(x)
  const vy = useVelocity(y)
  // Stretch along the direction of travel, proportional to speed.
  const speed = useTransform(() =>
    Math.min(1, Math.hypot(vx.get(), vy.get()) / 2500),
  )
  const scaleX = useTransform(speed, (s) => 1 + s * 0.8)
  const scaleY = useTransform(speed, (s) => 1 - s * 0.4)
  const rotate = useTransform(
    () => (Math.atan2(vy.get(), vx.get()) * 180) / Math.PI,
  )

  return (
    <div
      ref={area}
      onPointerMove={(e) => {
        const r = area.current?.getBoundingClientRect()
        if (!r) return
        mx.set(e.clientX - r.left)
        my.set(e.clientY - r.top)
      }}
      onPointerLeave={() => {
        mx.set(-100)
        my.set(-100)
      }}
      className="bg-dot-grid relative h-56 cursor-none overflow-hidden rounded-xl bg-surface-2"
    >
      <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted-foreground">
        Move your pointer here, fast and slow
      </p>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 -mt-8 -ml-8 size-16 rounded-full bg-page-accent mix-blend-difference"
        style={{ x, y, scaleX, scaleY, rotate }}
      />
    </div>
  )
}

export function VelocityDemo() {
  return (
    <DemoSection
      id="velocity"
      index={8}
      title="useMotionValue + useVelocity"
      description="The blob follows a spring-smoothed pointer; useVelocity derives its speed and heading, which stretch and rotate it. Below, useVelocity on the page's scrollY drives a marquee of Faker company names: scroll faster and it speeds up, skews and flips direction."
      source="generated"
      sourceLabel="Faker companies"
    >
      <div className="flex flex-col gap-6">
        <CursorBlob />
        <div className="-mx-4 flex flex-col gap-2 sm:-mx-6">
          <Marquee baseVelocity={-3} items={COMPANIES.slice(0, 6)} />
          <Marquee baseVelocity={3} items={COMPANIES.slice(6)} />
        </div>
      </div>
    </DemoSection>
  )
}
