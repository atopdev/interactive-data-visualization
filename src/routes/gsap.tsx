import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { DemoPage, type DataCredit, type TocEntry } from '@/components/page/demo-page'
import { CardDeckDemo } from '@/features/gsap/demos/card-deck'
import { CountersDemo } from '@/features/gsap/demos/counters'
import { DrawMorphDemo } from '@/features/gsap/demos/draw-morph'
import { FlipGalleryDemo } from '@/features/gsap/demos/flip-gallery'
import { HorizontalScrollDemo } from '@/features/gsap/demos/horizontal-scroll'
import { MagneticDemo } from '@/features/gsap/demos/magnetic'
import { MotionPathDemo } from '@/features/gsap/demos/motion-path'
import { ObserverSlidesDemo } from '@/features/gsap/demos/observer-slides'
import { ParallaxDemo } from '@/features/gsap/demos/parallax'
import { ScrambleTextDemo } from '@/features/gsap/demos/scramble-text'
import { SplitHeroDemo } from '@/features/gsap/demos/split-hero'
import { StaggerGridDemo } from '@/features/gsap/demos/stagger-grid'
import { TimelinePlaygroundDemo } from '@/features/gsap/demos/timeline-playground'
import { npmDownloadsQuery, quakesQuery } from '@/features/gsap/queries'
import { ensureWithBudget } from '@/lib/query'

const searchSchema = z.object({
  demo: z.string().optional().catch(undefined),
  split: z.enum(['chars', 'words', 'lines']).optional().catch(undefined),
  layout: z.enum(['grid', 'list']).optional().catch(undefined),
  filter: z
    .enum(['All', 'Nature', 'City', 'People', 'Abstract', 'Travel'])
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute('/gsap')({
  validateSearch: searchSchema,
  loader: ({ context: { queryClient } }) =>
    ensureWithBudget([
      queryClient.ensureQueryData(npmDownloadsQuery()),
      queryClient.ensureQueryData(quakesQuery()),
    ]),
  component: GsapPage,
})

const TOC: TocEntry[] = [
  { id: 'split-text', title: 'SplitText reveal' },
  { id: 'horizontal-scroll', title: 'Horizontal scroll' },
  { id: 'draw-morph', title: 'DrawSVG + MorphSVG' },
  { id: 'motion-path', title: 'MotionPath' },
  { id: 'flip', title: 'Flip layouts' },
  { id: 'card-deck', title: 'Throwable deck' },
  { id: 'stagger-grid', title: 'Grid stagger' },
  { id: 'magnetic', title: 'Magnetic buttons' },
  { id: 'parallax', title: 'Parallax scene' },
  { id: 'timeline', title: 'Timeline playground' },
  { id: 'observer', title: 'Observer slides' },
  { id: 'scramble', title: 'Text scramble' },
  { id: 'counters', title: 'Live counters' },
]

const CREDITS: DataCredit[] = [
  {
    name: 'npm registry downloads API',
    url: 'https://github.com/npm/registry/blob/main/docs/download-counts.md',
    note: 'Daily downloads for the counters',
  },
  {
    name: 'USGS Earthquake Hazards Program',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php',
    note: 'Past-week earthquake feed',
  },
  {
    name: 'Lorem Picsum',
    url: 'https://picsum.photos',
    note: 'Seeded photographs for galleries and parallax layers',
  },
  {
    name: 'Faker',
    url: 'https://fakerjs.dev',
    note: 'Seeded names, captions and headlines',
  },
]

function GsapPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const update = (next: Partial<z.infer<typeof searchSchema>>) =>
    void navigate({
      search: (prev) => ({ ...prev, ...next }),
      replace: true,
      resetScroll: false,
    })

  return (
    <DemoPage
      pageId="gsap"
      focus={search.demo}
      lead={
        <>
          GSAP is a timeline-first animation engine. Every plugin is now free, so this
          page uses them all: SplitText, ScrollTrigger, Flip, Draggable with Inertia,
          DrawSVG, MorphSVG, MotionPath, Observer and ScrambleText. Each demo runs inside
          a scoped <code className="font-mono text-sm">useGSAP</code> context that cleans
          itself up.
        </>
      }
      toc={TOC}
      credits={CREDITS}
    >
      <SplitHeroDemo
        mode={search.split ?? 'chars'}
        onModeChange={(split) => update({ split })}
      />
      <HorizontalScrollDemo />
      <DrawMorphDemo />
      <MotionPathDemo />
      <FlipGalleryDemo
        layout={search.layout ?? 'grid'}
        filter={search.filter ?? 'All'}
        onChange={update}
      />
      <CardDeckDemo />
      <StaggerGridDemo />
      <MagneticDemo />
      <ParallaxDemo />
      <TimelinePlaygroundDemo />
      <ObserverSlidesDemo />
      <ScrambleTextDemo />
      <CountersDemo />
    </DemoPage>
  )
}
