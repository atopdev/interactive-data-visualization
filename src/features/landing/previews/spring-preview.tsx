import { animated, config, useSprings } from '@react-spring/web'
import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { seededRandom } from '@/lib/random'

const BARS = 14
const rand = seededRandom('landing-spring')

/** Mini equalizer: wobbly springs chase new random heights. */
export default function SpringPreview() {
  const reduced = usePrefersReducedMotion()
  const [heights, setHeights] = useState(() =>
    Array.from({ length: BARS }, () => 0.2 + rand() * 0.8),
  )

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(
      () => setHeights(Array.from({ length: BARS }, () => 0.15 + rand() * 0.85)),
      1100,
    )
    return () => window.clearInterval(id)
  }, [reduced])

  const [springs] = useSprings(
    BARS,
    (i) => ({
      scaleY: heights[i],
      config: config.wobbly,
      delay: i * 30,
      immediate: reduced,
    }),
    [heights, reduced],
  )

  return (
    <div
      className="flex size-full items-end justify-center gap-1.5 px-6 pb-6"
      aria-hidden
    >
      {springs.map((style, i) => (
        <animated.span
          key={i}
          className="h-[80%] w-full max-w-4 origin-bottom rounded-t-md"
          style={{
            scaleY: style.scaleY,
            background: `color-mix(in oklab, var(--accent-spring) ${40 + (i % 5) * 12}%, var(--series-7))`,
          }}
        />
      ))}
    </div>
  )
}
