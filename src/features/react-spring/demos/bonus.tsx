import { Parallax, ParallaxLayer, type IParallax } from '@react-spring/parallax'
import { animated, useInView, useScroll, useSpring } from '@react-spring/web'
import { ChevronDown } from 'lucide-react'
import { useRef, useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { SmartImage } from '@/components/page/smart-image'
import { Button } from '@/components/ui/button'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { useElementSize } from '@/hooks/use-element-size'
import { fakeWith } from '@/lib/fake'
import { picsum } from '@/lib/picsum'

const FAQ = fakeWith('spring-accordion', (f) =>
  Array.from({ length: 3 }, () => ({
    q: `${f.hacker.ingverb().replace(/^./, (c) => c.toUpperCase())} the ${f.hacker.noun()}?`,
    a: Array.from({ length: 2 }, () => f.hacker.phrase()).join(' '),
  })),
)
const PAGES = fakeWith('spring-parallax', (f) =>
  Array.from({ length: 3 }, () => ({
    title: f.company.catchPhrase(),
    city: f.location.city(),
  })),
)

/** Accordion whose height is a spring towards the measured content height. */
function AccordionItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string
  a: string
  open: boolean
  onToggle: () => void
}) {
  const reduced = usePrefersReducedMotion()
  const inner = useRef<HTMLDivElement>(null)
  const { height } = useElementSize(inner)
  const style = useSpring({
    height: open ? height : 0,
    opacity: open ? 1 : 0,
    rotate: open ? 180 : 0,
    config: { tension: 260, friction: open ? 18 : 30 },
    immediate: reduced,
  })
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium"
      >
        {q}
        <animated.span style={{ rotate: style.rotate }}>
          <ChevronDown className="size-4 text-muted-foreground" />
        </animated.span>
      </button>
      <animated.div
        style={{ height: style.height, opacity: style.opacity }}
        className="overflow-hidden"
      >
        <div ref={inner} className="px-4 pb-4 text-sm text-muted-foreground">
          {a}
        </div>
      </animated.div>
    </div>
  )
}

/** useScroll bound to the window, mapped onto an element's parallax. */
function ScrollParallax() {
  const reduced = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll()
  return (
    <div className="relative h-56 overflow-hidden rounded-xl bg-black">
      <animated.div
        className="absolute inset-[-25%]"
        style={{
          y: reduced ? 0 : scrollYProgress.to((p) => `${(p - 0.5) * 40}%`),
        }}
      >
        <SmartImage
          src={picsum({ seed: 'spring-scroll-parallax', w: 1200, h: 900 })}
          alt="Landscape moving with page scroll"
          width={1200}
          height={900}
          className="size-full opacity-80"
          style={{ aspectRatio: 'auto' }}
        />
      </animated.div>
      <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-sm font-medium text-white">
        useScroll → scrollYProgress
      </p>
    </div>
  )
}

/** useInView returns a ref and animated values that play when visible. */
function InViewReveal() {
  const [ref, springs] = useInView(
    () => ({
      from: { opacity: 0, y: 60, scale: 0.9 },
      to: { opacity: 1, y: 0, scale: 1 },
      config: { tension: 180, friction: 22 },
    }),
    { rootMargin: '-15% 0%' },
  )
  return (
    <div className="grid h-56 place-items-center rounded-xl bg-surface-2">
      <animated.div
        ref={ref}
        style={springs}
        className="rounded-xl border bg-card px-6 py-4 text-center shadow"
      >
        <p className="text-2xl font-semibold">useInView</p>
        <p className="text-xs text-muted-foreground">springs in once visible</p>
      </animated.div>
    </div>
  )
}

export function SpringBonusDemo() {
  const [open, setOpen] = useState<number | null>(0)
  const parallax = useRef<IParallax>(null)
  return (
    <DemoSection
      id="bonus"
      index={11}
      title="Bonus: scroll, in-view, Parallax and accordion"
      description="Window useScroll drives an image parallax; useInView returns a ref plus springs that play when visible; @react-spring/parallax builds a self-contained multi-page scroller with layers moving at different speeds; and the accordion springs its height towards content measured with ResizeObserver."
      source="generated"
      sourceLabel="picsum.photos + Faker"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ScrollParallax />
        <InViewReveal />
        <div className="relative h-80 overflow-hidden rounded-xl border bg-surface-2">
          <Parallax ref={parallax} pages={3} className="no-scrollbar">
            {PAGES.map((p, i) => (
              <ParallaxLayer key={`bg-${i}`} offset={i} speed={0.2} factor={1}>
                <SmartImage
                  src={picsum({
                    seed: `spring-parallax-${i}`,
                    w: 900,
                    h: 700,
                    blur: 1,
                  })}
                  alt={`Backdrop near ${p.city}`}
                  width={900}
                  height={700}
                  className="size-full opacity-40"
                  style={{ aspectRatio: 'auto' }}
                />
              </ParallaxLayer>
            ))}
            {PAGES.map((p, i) => (
              <ParallaxLayer
                key={`fg-${i}`}
                offset={i}
                speed={0.9}
                className="flex flex-col items-center justify-center gap-3 p-6 text-center"
              >
                <p className="font-mono text-xs text-muted-foreground">
                  Page {i + 1} / {PAGES.length} · {p.city}
                </p>
                <p className="text-2xl font-semibold tracking-tight">{p.title}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => parallax.current?.scrollTo((i + 1) % PAGES.length)}
                >
                  {i < PAGES.length - 1 ? 'Next layer' : 'Back to top'}
                </Button>
              </ParallaxLayer>
            ))}
            <ParallaxLayer offset={1.3} speed={-0.3} className="pointer-events-none">
              <div className="ml-[70%] size-16 rounded-full bg-page-accent opacity-70 blur-sm" />
            </ParallaxLayer>
          </Parallax>
        </div>
        <div className="flex flex-col gap-2 rounded-xl bg-surface-2 p-4">
          {FAQ.map((item, i) => (
            <AccordionItem
              key={item.q}
              q={item.q}
              a={item.a}
              open={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </DemoSection>
  )
}
