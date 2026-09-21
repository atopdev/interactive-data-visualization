import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { SmartImage } from '@/components/page/smart-image'
import { Button } from '@/components/ui/button'
import { prefersReducedMotion } from '@/hooks/use-reduced-motion'
import { fakeWith } from '@/lib/fake'
import { picsumSet } from '@/lib/picsum'
import { cn } from '@/lib/utils'
import { gsap, Observer, useGSAP } from '../gsap'

const SLIDES = picsumSet('gsap-observer', 4, 1400, 900).map((img, i) => ({
  ...img,
  ...fakeWith(`gsap-observer-${i}`, (f) => ({
    kicker: f.commerce.department(),
    headline: f.company.catchPhrase(),
  })),
}))

export function ObserverSlidesDemo() {
  const scope = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)
  // Set from inside the GSAP context; buttons call it from event handlers.
  const goRef = useRef<(step: number | 'prev' | 'next') => void>(() => {})

  useGSAP(
    (_context, contextSafe) => {
      const el = scope.current
      if (!el || !contextSafe) return
      const slides = gsap.utils.toArray<HTMLElement>('[data-slide]')
      gsap.set(slides, { xPercent: (i) => (i === 0 ? 0 : 100) })
      let index = 0
      let busy = false

      const go = contextSafe((request: number | 'prev' | 'next') => {
        const total = SLIDES.length
        const next =
          request === 'next' ? index + 1 : request === 'prev' ? index - 1 : request
        const target = ((next % total) + total) % total
        if (busy || target === index) return
        busy = true
        const dir = next > index ? 1 : -1
        const outgoing = slides[index]
        const incoming = slides[target]
        const reduced = prefersReducedMotion()
        gsap
          .timeline({
            defaults: { duration: reduced ? 0 : 1, ease: 'power3.inOut' },
            onComplete: () => {
              busy = false
            },
          })
          .set(incoming, { xPercent: dir * 100, zIndex: 2 })
          .set(outgoing, { zIndex: 1 })
          .to(outgoing, { xPercent: -dir * 30 }, 0)
          .to(incoming, { xPercent: 0 }, 0)
          .fromTo(
            incoming.querySelector('[data-slide-img]'),
            { scale: 1.3 },
            { scale: 1, duration: reduced ? 0 : 1.4 },
            0,
          )
          .from(
            incoming.querySelector('[data-slide-text]'),
            {
              y: 60,
              opacity: 0,
              duration: reduced ? 0 : 0.8,
              ease: 'power3.out',
            },
            0.4,
          )
        index = target
        setCurrent(target)
      })
      goRef.current = go

      // Observer normalizes touch swipes and pointer drags into left/right
      // intents. Vertical swipes are left to the browser so the page scrolls.
      const obs = Observer.create({
        target: el,
        type: 'touch,pointer',
        tolerance: 24,
        lockAxis: true,
        onLeft: () => go('next'),
        onRight: () => go('prev'),
      })
      // Wheel only hijacks scrolling while there is a slide to move to, so the
      // page keeps scrolling past the first and last slide.
      const onWheel = (e: WheelEvent) => {
        if (Math.abs(e.deltaY) < 8) return
        const next = index + (e.deltaY > 0 ? 1 : -1)
        if (next < 0 || next >= SLIDES.length) return
        e.preventDefault()
        go(next)
      }
      el.addEventListener('wheel', onWheel, { passive: false })
      return () => {
        obs.kill()
        el.removeEventListener('wheel', onWheel)
      }
    },
    { scope },
  )

  return (
    <DemoSection
      id="observer"
      index={11}
      title="Observer-driven slides"
      description="Observer turns touch swipes and pointer drags inside the frame into a single onLeft/onRight intent (the wheel advances too, until the last slide), so one gesture always advances exactly one slide. The incoming slide wipes over while the outgoing one parallaxes away."
      source="generated"
      sourceLabel="picsum.photos + Faker"
      bodyClassName="p-0 sm:p-0"
      controls={
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={() => goRef.current('prev')}>
            <ChevronLeft /> Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => goRef.current('next')}>
            <ChevronRight /> Next
          </Button>
        </div>
      }
    >
      <div
        ref={scope}
        className="relative h-[28rem] touch-pan-y overflow-hidden bg-black select-none"
        aria-roledescription="carousel"
      >
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            data-slide
            aria-hidden={i !== current}
            className="absolute inset-0 overflow-hidden"
          >
            <div data-slide-img className="absolute inset-0">
              <SmartImage
                src={s.src}
                placeholder={s.placeholder}
                alt={s.alt}
                width={s.width}
                height={s.height}
                className="size-full"
                style={{ aspectRatio: 'auto' }}
                draggable={false}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div
              data-slide-text
              className="absolute inset-x-0 bottom-0 p-8 pb-12 text-white sm:p-12"
            >
              <p className="font-mono text-xs tracking-widest text-white/70 uppercase">
                {String(i + 1).padStart(2, '0')} · {s.kicker}
              </p>
              <p className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
                {s.headline}
              </p>
            </div>
          </div>
        ))}
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goRef.current(i)}
              className={cn(
                'h-1.5 w-6 rounded-full bg-white/40 transition-all',
                i === current && 'w-10 bg-white',
              )}
            />
          ))}
        </div>
        <p className="absolute top-4 left-4 z-10 rounded-full bg-black/40 px-3 py-1 text-xs text-white/80 backdrop-blur">
          Wheel, swipe or drag inside the frame
        </p>
      </div>
    </DemoSection>
  )
}
