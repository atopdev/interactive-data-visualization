import { motion, MotionConfig } from 'motion/react'
import { useEffect, useState } from 'react'
import { seededRandom } from '@/lib/fake'

const rand = seededRandom('landing-motion')
const TILES = Array.from({ length: 9 }, (_, i) => i)

function shuffle(items: number[]) {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

/** Mini layout animation: tiles reshuffle and glide to their new cells. */
export default function MotionPreview() {
  const [order, setOrder] = useState(TILES)

  useEffect(() => {
    const id = window.setInterval(() => setOrder(shuffle), 1600)
    return () => window.clearInterval(id)
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid size-full place-content-center">
        <div className="grid grid-cols-3 gap-2">
          {order.map((tile) => (
            <motion.span
              key={tile}
              layout
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className="size-9 rounded-xl sm:size-10"
              style={{
                background:
                  tile === 4
                    ? 'var(--accent-motion)'
                    : `color-mix(in oklab, var(--accent-motion) ${25 + tile * 7}%, var(--muted))`,
              }}
            />
          ))}
        </div>
      </div>
    </MotionConfig>
  )
}
