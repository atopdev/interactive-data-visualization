import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { SmartImage } from '@/components/page/smart-image'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { fakeWith } from '@/lib/fake'
import { PICSUM_CATEGORIES, picsum, type PicsumCategory } from '@/lib/picsum'

const TILES = fakeWith('motion-masonry', (f) =>
  Array.from({ length: 14 }, (_, i) => {
    const tall = f.datatype.boolean({ probability: 0.35 })
    const wide = !tall && f.datatype.boolean({ probability: 0.2 })
    const w = wide ? 800 : 400
    const h = tall ? 800 : 400
    const noun = f.word.noun()
    const category = f.helpers.arrayElement(PICSUM_CATEGORIES)
    return {
      id: `m-${i}`,
      src: picsum({ seed: `motion-masonry-${i}-${noun}`, w, h }),
      w,
      h,
      tall,
      wide,
      category,
      title: `${f.word.adjective()} ${noun}`,
      alt: `${category} photograph of a ${noun}`,
      caption: f.company.catchPhrase(),
    }
  }),
)

type Filter = 'All' | PicsumCategory

export function MasonryFilterDemo() {
  const [filter, setFilter] = useState<Filter>('All')
  const [flipped, setFlipped] = useState<Set<string>>(new Set())
  const visible = TILES.filter((t) => filter === 'All' || t.category === filter)

  const toggle = (id: string) =>
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <DemoSection
      id="layout-group"
      index={12}
      title="LayoutGroup masonry reflow + card flip"
      description="Filtering changes which tiles render; every survivor has the layout prop inside a LayoutGroup, so the dense grid reflows smoothly while leavers shrink out through AnimatePresence. Click a tile to flip it in 3D to its caption."
      source="generated"
      sourceLabel="picsum.photos + Faker"
      controls={
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={filter}
          onValueChange={(v) => v && setFilter(v as Filter)}
          aria-label="Filter photos"
          className="flex-wrap"
        >
          {(['All', ...PICSUM_CATEGORIES] as const).map((c) => (
            <ToggleGroupItem key={c} value={c} className="px-3">
              {c}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      }
    >
      <LayoutGroup>
        <motion.div
          layout
          className="grid grid-flow-dense auto-rows-[9rem] grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {visible.map((t) => {
              const isFlipped = flipped.has(t.id)
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  onClick={() => toggle(t.id)}
                  aria-pressed={isFlipped}
                  aria-label={`${t.title}: flip card`}
                  className={`relative ${t.tall ? 'row-span-2' : ''} ${t.wide ? 'col-span-2' : ''}`}
                  style={{ perspective: 900 }}
                >
                  <motion.div
                    className="relative size-full"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div
                      className="absolute inset-0 overflow-hidden rounded-xl"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <SmartImage
                        src={t.src}
                        alt={t.alt}
                        width={t.w}
                        height={t.h}
                        className="size-full"
                        style={{ aspectRatio: 'auto' }}
                      />
                      <span className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white backdrop-blur">
                        {t.category}
                      </span>
                    </div>
                    <div
                      className="absolute inset-0 flex flex-col justify-end rounded-xl border bg-card p-3 text-left"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      <p className="text-sm font-semibold capitalize">{t.title}</p>
                      <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                        {t.caption}
                      </p>
                    </div>
                  </motion.div>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    </DemoSection>
  )
}
