import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { SmartImage } from '@/components/page/smart-image'
import { fakeWith } from '@/lib/fake'
import { picsumSet } from '@/lib/picsum'

const PHOTOS = picsumSet('motion-shared', 8, 800, 600).map((p, i) => ({
  ...p,
  ...fakeWith(`motion-shared-${i}`, (f) => ({
    author: f.person.fullName(),
    location: `${f.location.city()}, ${f.location.country()}`,
    story: f.company.catchPhrase(),
    likes: f.number.int({ min: 120, max: 9800 }),
  })),
}))

export function SharedLayoutDemo() {
  const [active, setActive] = useState<string | null>(null)
  const photo = PHOTOS.find((p) => p.id === active)

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setActive(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  return (
    <DemoSection
      id="shared-layout"
      index={1}
      title="Shared-element transition (layoutId)"
      description="Each thumbnail and the detail view share a layoutId, so Motion measures both and animates the image, title and card between them with a single spring, even though they are different elements in different parts of the tree."
      source="generated"
      sourceLabel="picsum.photos + Faker"
      reveal
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PHOTOS.map((p) => (
          <motion.button
            key={p.id}
            type="button"
            layoutId={`card-${p.id}`}
            onClick={() => setActive(p.id)}
            className="overflow-hidden rounded-xl border bg-card text-left"
            whileHover={{ y: -4 }}
            style={{ borderRadius: 12 }}
            aria-label={`Open ${p.title}`}
          >
            <motion.div layoutId={`img-${p.id}`}>
              <SmartImage src={p.src} alt={p.alt} width={p.width} height={p.height} />
            </motion.div>
            <motion.p
              layoutId={`title-${p.id}`}
              className="truncate p-2.5 text-sm font-medium"
            >
              {p.title}
            </motion.p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {photo && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActive(null)}
            />
            <div className="pointer-events-none fixed inset-0 z-[61] grid place-items-center p-4">
              <motion.div
                layoutId={`card-${photo.id}`}
                role="dialog"
                aria-modal="true"
                aria-label={photo.title}
                className="pointer-events-auto w-full max-w-2xl overflow-hidden border bg-card shadow-2xl"
                style={{ borderRadius: 20 }}
              >
                <motion.div layoutId={`img-${photo.id}`} className="relative">
                  <SmartImage
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                  />
                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </button>
                </motion.div>
                <div className="p-5">
                  <motion.p
                    layoutId={`title-${photo.id}`}
                    className="text-xl font-semibold"
                  >
                    {photo.title}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  >
                    <p className="mt-1 text-sm text-muted-foreground">
                      {photo.author} · {photo.location}
                    </p>
                    <p className="mt-3 text-sm">{photo.story}.</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {photo.likes.toLocaleString('en')} likes · {photo.category}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </DemoSection>
  )
}
