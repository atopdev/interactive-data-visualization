import { useRef } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { SmartImage } from '@/components/page/smart-image'
import { fakeWith } from '@/lib/fake'
import { picsumSet } from '@/lib/picsum'
import { gsap, MOTION_OK, useGSAP } from '../gsap'

const PANELS = picsumSet('gsap-horizontal', 6, 900, 640).map((img, i) => ({
  ...img,
  ...fakeWith(`gsap-horizontal-${i}`, (f) => ({
    place: f.location.city(),
    country: f.location.country(),
    caption: `A ${f.word.adjective()} ${f.word.noun()} ${f.location.direction().toLowerCase()} of ${f.location.city()}, photographed by ${f.person.fullName()}.`,
  })),
}))

export function HorizontalScrollDemo() {
  const wrapper = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const wrap = wrapper.current
        const rail = track.current
        if (!wrap || !rail) return
        const distance = () => rail.scrollWidth - wrap.clientWidth
        const tween = gsap.to(rail, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: wrap,
            pin: true,
            scrub: 0.8,
            start: 'center center',
            end: () => `+=${distance()}`,
            invalidateOnRefresh: true,
          },
        })
        // Each caption slides in as its panel crosses the viewport (containerAnimation).
        gsap.utils.toArray<HTMLElement>('[data-caption]', rail).forEach((caption) => {
          gsap.from(caption, {
            y: 40,
            opacity: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: caption,
              containerAnimation: tween,
              start: 'left 85%',
              end: 'left 45%',
              scrub: true,
            },
          })
        })
        gsap.utils.toArray<HTMLElement>('[data-panel-img]', rail).forEach((img) => {
          gsap.fromTo(
            img,
            { xPercent: -12 },
            {
              xPercent: 12,
              ease: 'none',
              scrollTrigger: {
                trigger: img,
                containerAnimation: tween,
                start: 'left right',
                end: 'right left',
                scrub: true,
              },
            },
          )
        })
      })
      return () => mm.revert()
    },
    { scope: wrapper },
  )

  return (
    <DemoSection
      id="horizontal-scroll"
      index={2}
      title="Pinned horizontal scroll"
      description="ScrollTrigger pins the gallery and converts vertical scroll into horizontal travel. Nested triggers use containerAnimation so each caption and image parallax is keyed to the horizontal position. With reduced motion it falls back to a native horizontal scroller."
      source="generated"
      sourceLabel="picsum.photos + Faker"
      bodyClassName="p-0 sm:p-0"
    >
      <div
        ref={wrapper}
        className="overflow-hidden motion-reduce:overflow-x-auto"
        aria-label="Horizontally scrolling gallery"
      >
        <div ref={track} className="flex w-max gap-5 p-5 sm:gap-6 sm:p-6">
          {PANELS.map((panel, i) => (
            <figure
              key={panel.id}
              className="relative w-[78vw] max-w-xl shrink-0 overflow-hidden rounded-2xl sm:w-[52vw]"
            >
              <div className="overflow-hidden">
                <div data-panel-img className="scale-125">
                  <SmartImage
                    src={panel.src}
                    placeholder={panel.placeholder}
                    alt={panel.alt}
                    width={panel.width}
                    height={panel.height}
                  />
                </div>
              </div>
              <figcaption
                data-caption
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-16 text-white"
              >
                <p className="font-mono text-xs text-white/70">
                  {String(i + 1).padStart(2, '0')} / {PANELS.length}
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {panel.place}, {panel.country}
                </p>
                <p className="mt-1 max-w-md text-sm text-white/80">{panel.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </DemoSection>
  )
}
