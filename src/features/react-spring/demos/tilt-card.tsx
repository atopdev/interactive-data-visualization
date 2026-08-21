import { animated, to, useSpring } from '@react-spring/web'
import { useRef } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { SmartImage } from '@/components/page/smart-image'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { fakeWith } from '@/lib/fake'
import { picsum } from '@/lib/picsum'

const CARD = fakeWith('spring-tilt', (f) => ({
  title: f.company.catchPhrase(),
  place: f.location.city(),
  author: f.person.fullName(),
}))

export function TiltCardDemo() {
  const reduced = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [{ rx, ry, s, gx, gy }, api] = useSpring(() => ({
    rx: 0,
    ry: 0,
    s: 1,
    gx: 50,
    gy: 50,
    config: { mass: 1, tension: 350, friction: 30 },
  }))

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r || reduced) return
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    api.start({
      rx: (0.5 - py) * 24,
      ry: (px - 0.5) * 28,
      s: 1.05,
      gx: px * 100,
      gy: py * 100,
    })
  }

  return (
    <DemoSection
      id="tilt"
      index={7}
      title="3D tilt and parallax card"
      description="Pointer position feeds a single spring with rotateX, rotateY, scale and a glare position. to() interpolates those values into perspective(...) rotateX(...) rotateY(...) strings, and inner layers translate in Z for parallax depth."
      source="generated"
      sourceLabel="picsum.photos + Faker"
    >
      <div
        className="bg-dot-grid grid h-[28rem] place-items-center rounded-xl bg-surface-2"
        style={{ perspective: 900 }}
      >
        <animated.div
          ref={ref}
          onPointerMove={onMove}
          onPointerLeave={() => api.start({ rx: 0, ry: 0, s: 1, gx: 50, gy: 50 })}
          className="relative w-72 overflow-hidden rounded-3xl border bg-card shadow-2xl sm:w-80"
          style={{
            transformStyle: 'preserve-3d',
            transform: to(
              [rx, ry, s],
              (x, y, sc) =>
                `perspective(900px) rotateX(${x}deg) rotateY(${y}deg) scale(${sc})`,
            ),
          }}
        >
          <SmartImage
            src={picsum({ seed: 'spring-tilt-card', w: 640, h: 800 })}
            alt={`Photograph from ${CARD.place}`}
            width={640}
            height={800}
          />
          <animated.div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-overlay"
            style={{
              background: to(
                [gx, gy],
                (x, y) =>
                  `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.55), transparent 55%)`,
              ),
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 text-white"
            style={{ transform: 'translateZ(60px)' }}
          >
            <p className="font-mono text-[11px] tracking-widest text-white/70 uppercase">
              {CARD.place}
            </p>
            <p className="mt-1 text-lg leading-tight font-semibold">{CARD.title}</p>
            <p className="mt-1 text-xs text-white/70">by {CARD.author}</p>
          </div>
        </animated.div>
      </div>
    </DemoSection>
  )
}
