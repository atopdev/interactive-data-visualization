import { useRef } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { fakeWith } from '@/lib/fake'
import { SmartImage } from '@/components/page/smart-image'
import { picsum } from '@/lib/picsum'
import { gsap, MOTION_OK, useGSAP } from '../gsap'

const TITLE = fakeWith('gsap-parallax', (f) => ({
  place: f.location.city(),
  words: f.word.adjective(),
}))

// Back-to-front layers; `depth` drives both scroll and pointer parallax.
const LAYERS = [
  {
    label: 'Blurred sky backdrop',
    seed: 'parallax-sky',
    w: 1600,
    h: 1000,
    blur: 3,
    depth: 0.15,
    className: 'inset-[-12%]',
  },
  {
    label: 'Distant grayscale photograph',
    seed: 'parallax-far',
    w: 520,
    h: 700,
    grayscale: true,
    depth: 0.35,
    className: 'left-[6%] top-[18%] w-[26%] rotate-[-6deg] rounded-2xl',
  },
  {
    label: 'Mid-ground photograph',
    seed: 'parallax-mid',
    w: 600,
    h: 760,
    depth: 0.6,
    className: 'right-[8%] top-[10%] w-[30%] rotate-[5deg] rounded-2xl',
  },
  {
    label: 'Foreground photograph',
    seed: 'parallax-near',
    w: 700,
    h: 500,
    depth: 1,
    className: 'left-[30%] bottom-[-8%] w-[40%] rotate-[-2deg] rounded-2xl',
  },
] as const

export function ParallaxDemo() {
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const layers = gsap.utils.toArray<HTMLElement>('[data-depth]')
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: scope.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        })
        layers.forEach((layer) => {
          const depth = Number(layer.dataset.depth)
          tl.fromTo(
            layer,
            { yPercent: depth * 30 },
            { yPercent: depth * -30, ease: 'none' },
            0,
          )
        })
        tl.fromTo(
          '[data-parallax-title]',
          { yPercent: 60, scale: 0.9 },
          { yPercent: -60, scale: 1.1, ease: 'none' },
          0,
        )

        // Pointer parallax on an inner wrapper so it composes with the scroll tween.
        const inners = gsap.utils.toArray<HTMLElement>('[data-depth-inner]')
        const setters = inners.map((el) => ({
          depth: Number(el.dataset.depthInner),
          x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3' }),
          y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3' }),
        }))
        const el = scope.current
        const onMove = (e: PointerEvent) => {
          if (!el) return
          const r = el.getBoundingClientRect()
          const nx = (e.clientX - r.left) / r.width - 0.5
          const ny = (e.clientY - r.top) / r.height - 0.5
          setters.forEach((s) => {
            s.x(nx * -40 * s.depth)
            s.y(ny * -30 * s.depth)
          })
        }
        el?.addEventListener('pointermove', onMove)
        return () => el?.removeEventListener('pointermove', onMove)
      })
      return () => mm.revert()
    },
    { scope },
  )

  return (
    <DemoSection
      id="parallax"
      index={9}
      title="Multi-layer parallax scene"
      description="Four picsum layers (blurred sky, grayscale, color) move at speeds proportional to their depth as the scene scrolls through the viewport. Moving the pointer adds a second parallax on inner wrappers so the two effects compose."
      source="generated"
      sourceLabel="picsum.photos (blur + grayscale)"
      bodyClassName="p-0 sm:p-0"
    >
      <div ref={scope} className="relative h-[34rem] overflow-hidden bg-black">
        {LAYERS.map((l) => (
          <div key={l.seed} data-depth={l.depth} className={`absolute ${l.className}`}>
            <div data-depth-inner={l.depth} className="size-full">
              <SmartImage
                src={picsum({
                  seed: l.seed,
                  w: l.w,
                  h: l.h,
                  blur: 'blur' in l ? l.blur : undefined,
                  grayscale: 'grayscale' in l ? l.grayscale : undefined,
                })}
                placeholder={picsum({
                  seed: l.seed,
                  w: 40,
                  h: Math.round((40 * l.h) / l.w),
                  blur: 4,
                })}
                alt={`${l.label} layer of the parallax scene`}
                width={l.w}
                height={l.h}
                className={
                  l.depth === 0.15 ? 'size-full opacity-70' : 'rounded-2xl shadow-2xl'
                }
                style={l.depth === 0.15 ? { aspectRatio: 'auto' } : undefined}
              />
            </div>
          </div>
        ))}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
        <div
          data-parallax-title
          className="absolute inset-0 grid place-items-center text-center text-white"
        >
          <div>
            <p className="font-mono text-xs tracking-[0.3em] text-white/70 uppercase">
              Depth study
            </p>
            <p className="mt-2 text-5xl font-semibold tracking-tight capitalize sm:text-7xl">
              {TITLE.words} {TITLE.place}
            </p>
          </div>
        </div>
      </div>
    </DemoSection>
  )
}
