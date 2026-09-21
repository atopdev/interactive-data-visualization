import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'
import { useRef, useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { SmartImage } from '@/components/page/smart-image'
import { fakeWith } from '@/lib/fake'
import { picsum } from '@/lib/picsum'

const COPY = fakeWith('motion-scroll', (f) => ({
  title: f.company.catchPhrase(),
  city: f.location.city(),
}))

/** Page-level reading progress bar pinned under the header. */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  })
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-14 z-40 h-0.5 origin-left bg-page-accent"
      style={{ scaleX }}
    />
  )
}

export function ScrollLinkedDemo() {
  const target = useRef<HTMLDivElement>(null)
  // Progress of this element crossing the viewport: 0 when its top meets the
  // bottom of the screen, 1 when its bottom leaves the top.
  const { scrollYProgress } = useScroll({
    target,
    offset: ['start end', 'end start'],
  })
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 24 })
  const bgY = useTransform(smooth, [0, 1], ['-18%', '18%'])
  const fgY = useTransform(smooth, [0, 1], ['30%', '-30%'])
  const scale = useTransform(smooth, [0, 0.5, 1], [0.85, 1, 0.85])
  const rotate = useTransform(smooth, [0, 1], [-8, 8])
  const opacity = useTransform(smooth, [0, 0.25, 0.75, 1], [0, 1, 1, 0])
  const [pct, setPct] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => setPct(Math.round(v * 100)))

  return (
    <DemoSection
      id="scroll-linked"
      index={7}
      title="useScroll + useTransform + useSpring"
      description="useScroll exposes this section's progress through the viewport as a motion value. useSpring smooths it and useTransform maps it onto background and foreground offsets, scale, rotation and opacity without a single React render. The bar under the header is the page-level scrollYProgress."
      source="generated"
      sourceLabel="picsum.photos"
      bodyClassName="p-0 sm:p-0"
    >
      <div ref={target} className="relative h-[32rem] overflow-hidden bg-black">
        <motion.div className="absolute inset-[-20%]" style={{ y: bgY }}>
          <SmartImage
            src={picsum({
              seed: 'motion-scroll-bg',
              w: 1600,
              h: 1200,
              blur: 2,
            })}
            alt={`Blurred landscape near ${COPY.city}`}
            width={1600}
            height={1200}
            className="size-full opacity-60"
            style={{ aspectRatio: 'auto' }}
          />
        </motion.div>
        <motion.div
          className="absolute top-1/2 left-1/2 w-[55%] max-w-md -translate-x-1/2 -translate-y-1/2"
          style={{ y: fgY, scale, rotate }}
        >
          <SmartImage
            src={picsum({ seed: 'motion-scroll-fg', w: 800, h: 560 })}
            alt={`Photograph taken in ${COPY.city}`}
            width={800}
            height={560}
            className="rounded-2xl shadow-2xl"
          />
        </motion.div>
        <motion.div
          style={{ opacity }}
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white"
        >
          <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {COPY.title}
          </p>
        </motion.div>
        <div className="absolute top-4 right-4 rounded-full bg-black/50 px-3 py-1 font-mono text-xs text-white backdrop-blur">
          progress {pct}%
        </div>
      </div>
    </DemoSection>
  )
}
