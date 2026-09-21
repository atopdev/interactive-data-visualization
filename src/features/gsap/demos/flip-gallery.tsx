import { LayoutGrid, List } from 'lucide-react'
import { useLayoutEffect, useRef } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { SmartImage } from '@/components/page/smart-image'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { fakeWith } from '@/lib/fake'
import { PICSUM_CATEGORIES, picsumSet, type PicsumCategory } from '@/lib/picsum'
import { cn } from '@/lib/utils'
import { Flip, gsap } from '../gsap'

export type FlipLayout = 'grid' | 'list'
export type FlipFilter = 'All' | PicsumCategory

const PHOTOS = picsumSet('gsap-flip', 12, 480, 360).map((p, i) => ({
  ...p,
  photographer: fakeWith(`gsap-flip-${i}`, (f) => f.person.fullName()),
}))

export function FlipGalleryDemo({
  layout,
  filter,
  onChange,
}: {
  layout: FlipLayout
  filter: FlipFilter
  onChange: (next: { layout?: FlipLayout; filter?: FlipFilter }) => void
}) {
  const scope = useRef<HTMLDivElement>(null)
  const state = useRef<Flip.FlipState | null>(null)
  const reduced = usePrefersReducedMotion()

  // Capture positions before React re-renders, then FLIP from them after.
  const capture = () => {
    if (!scope.current) return
    state.current = Flip.getState(
      scope.current.querySelectorAll('[data-flip-item]'),
      {
        props: 'opacity',
      },
    )
  }

  useLayoutEffect(() => {
    const prev = state.current
    if (!prev || !scope.current) return
    state.current = null
    const tl = Flip.from(prev, {
      duration: reduced ? 0 : 0.7,
      ease: 'power3.inOut',
      stagger: reduced ? 0 : 0.03,
      absolute: true,
      nested: true,
      onEnter: (els) =>
        gsap.fromTo(
          els,
          { opacity: 0, scale: 0.85 },
          { opacity: 1, scale: 1, duration: 0.5 },
        ),
      onLeave: (els) =>
        gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.4 }),
    })
    return () => {
      tl.kill()
    }
  }, [layout, filter, reduced])

  const visible = (category: string) => filter === 'All' || category === filter

  return (
    <DemoSection
      id="flip"
      index={5}
      title="Flip: grid ↔ list with filtering"
      description="Flip records every card's position, lets React re-render into the new layout, then animates from the old geometry to the new one. Filtered cards fade out via onLeave while survivors glide into place. The layout and filter live in the URL."
      source="generated"
      sourceLabel="picsum.photos + Faker"
      controls={
        <>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={layout}
            onValueChange={(v) => {
              if (!v) return
              capture()
              onChange({ layout: v as FlipLayout })
            }}
            aria-label="Layout"
          >
            <ToggleGroupItem value="grid" aria-label="Grid">
              <LayoutGrid />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List">
              <List />
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={filter}
            onValueChange={(v) => {
              if (!v) return
              capture()
              onChange({ filter: v as FlipFilter })
            }}
            aria-label="Category"
            className="flex-wrap"
          >
            {(['All', ...PICSUM_CATEGORIES] as const).map((c) => (
              <ToggleGroupItem key={c} value={c} className="px-3">
                {c}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </>
      }
    >
      <div
        ref={scope}
        className={cn(
          'relative grid gap-4',
          layout === 'grid'
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            : 'grid-cols-1',
        )}
      >
        {PHOTOS.map((p) => (
          <article
            key={p.id}
            data-flip-item
            data-flip-id={p.id}
            className={cn(
              'overflow-hidden rounded-xl border bg-card',
              layout === 'list' && 'flex items-center gap-4 p-2',
              !visible(p.category) && 'hidden',
            )}
          >
            <SmartImage
              src={p.src}
              alt={p.alt}
              width={p.width}
              height={p.height}
              className={cn(
                layout === 'list'
                  ? 'w-28 shrink-0 rounded-lg sm:w-36'
                  : 'w-full',
              )}
            />
            <div
              className={cn(
                'min-w-0',
                layout === 'grid' ? 'p-3' : 'flex-1 pr-2',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-semibold">{p.title}</h3>
                <Badge variant="secondary" className="shrink-0">
                  {p.category}
                </Badge>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                by {p.photographer}
              </p>
              {layout === 'list' && (
                <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                  {p.alt}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </DemoSection>
  )
}
