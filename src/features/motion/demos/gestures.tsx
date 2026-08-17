import { motion } from 'motion/react'
import { Heart, MousePointerClick, Search } from 'lucide-react'
import { useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { fakeWith } from '@/lib/fake'

const CARDS = fakeWith('motion-inview', (f) =>
  Array.from({ length: 6 }, () => ({
    product: f.commerce.productName(),
    price: f.commerce.price({ min: 12, max: 240, symbol: '$' }),
    adjective: f.commerce.productAdjective(),
  })),
)

export function GesturesDemo() {
  const [likes, setLikes] = useState(0)
  return (
    <DemoSection
      id="gestures"
      index={6}
      title="Gestures: hover, tap, focus, in view"
      description="whileHover, whileTap and whileFocus animate to a target while the gesture is active and back when it ends. The product cards below use whileInView with viewport={{ once: true }} so they rise in as they scroll into view."
      source="generated"
      sourceLabel="Faker products"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-center gap-5 rounded-xl bg-surface-2 p-8">
          <motion.button
            type="button"
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
          >
            <MousePointerClick className="size-4" /> Hover and tap
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setLikes((l) => l + 1)}
            whileTap={{ scale: 1.25, rotate: -8 }}
            whileHover={{ scale: 1.08 }}
            className="flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm font-medium"
            aria-label="Like"
          >
            <motion.span
              key={likes}
              initial={{ scale: likes ? 1.6 : 1 }}
              animate={{ scale: 1 }}
              className="text-red-500"
            >
              <Heart className="size-4 fill-current" />
            </motion.span>
            <span className="tabular-nums">{likes}</span>
          </motion.button>
          <motion.label
            whileFocus={{ scale: 1.03 }}
            className="relative flex items-center"
          >
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <motion.input
              type="search"
              placeholder="Focus me"
              whileFocus={{ width: 260, boxShadow: '0 0 0 3px var(--page-accent)' }}
              initial={{ width: 180 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="h-10 rounded-full border bg-card pr-4 pl-9 text-sm outline-none"
              aria-label="Search (focus animation)"
            />
          </motion.label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c, i) => (
            <motion.article
              key={c.product + i}
              initial={{ opacity: 0, y: 40, rotateX: -20 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 18,
                delay: (i % 3) * 0.08,
              }}
              whileHover={{ y: -6 }}
              className="rounded-xl border bg-card p-4"
              style={{ transformPerspective: 800 }}
            >
              <p className="text-xs text-muted-foreground capitalize">{c.adjective}</p>
              <p className="mt-1 font-medium">{c.product}</p>
              <p className="mt-3 font-mono text-sm text-page-accent">{c.price}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </DemoSection>
  )
}
