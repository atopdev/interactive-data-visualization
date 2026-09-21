import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { DemoPage, type TocEntry } from '@/components/page/demo-page'
import { SpringBonusDemo } from '@/features/react-spring/demos/bonus'
import { ChainDemo } from '@/features/react-spring/demos/chain'
import { CountersRingsDemo } from '@/features/react-spring/demos/counters-rings'
import { ImageViewerDemo } from '@/features/react-spring/demos/image-viewer'
import { PhysicsPlaygroundDemo } from '@/features/react-spring/demos/physics-playground'
import { PullToRefreshDemo } from '@/features/react-spring/demos/pull-to-refresh'
import { SortableListDemo } from '@/features/react-spring/demos/sortable-list'
import { SwipeDeckDemo } from '@/features/react-spring/demos/swipe-deck'
import { TiltCardDemo } from '@/features/react-spring/demos/tilt-card'
import { TrailDemo } from '@/features/react-spring/demos/trail'
import { TransitionListDemo } from '@/features/react-spring/demos/transition-list'
import { candlesQuery, weatherNowQuery } from '@/features/react-spring/queries'
import { ensureWithBudget } from '@/lib/query'

export const Route = createFileRoute('/react-spring')({
  validateSearch: z.object({ demo: z.string().optional().catch(undefined) }),
  loader: ({ context: { queryClient } }) =>
    ensureWithBudget([
      queryClient.ensureQueryData(weatherNowQuery()),
      queryClient.ensureQueryData(candlesQuery()),
    ]),
  component: ReactSpringPage,
})

const TOC: TocEntry[] = [
  { id: 'physics', title: 'Physics playground' },
  { id: 'trail', title: 'useTrail' },
  { id: 'transition', title: 'useTransition list' },
  { id: 'chain', title: 'useChain' },
  { id: 'sortable', title: 'Sortable list' },
  { id: 'swipe', title: 'Swipe deck' },
  { id: 'tilt', title: '3D tilt card' },
  { id: 'pull', title: 'Pull to refresh' },
  { id: 'viewer', title: 'Image viewer' },
  { id: 'counters', title: 'Counters & rings' },
  { id: 'bonus', title: 'Bonus' },
]

function ReactSpringPage() {
  const { demo } = Route.useSearch()
  return (
    <DemoPage
      pageId="react-spring"
      focus={demo}
      lead={
        <>
          React Spring animates with physics instead of durations and easing
          curves. Paired with{' '}
          <code className="font-mono text-sm">@use-gesture/react</code>, springs
          pick up the velocity of a drag, so throws, flicks and rubber bands
          feel physical. With reduced motion enabled, every spring on this page
          jumps straight to its target via the{' '}
          <code className="font-mono text-sm">immediate</code> flag.
        </>
      }
      toc={TOC}
    >
      <PhysicsPlaygroundDemo />
      <TrailDemo />
      <TransitionListDemo />
      <ChainDemo />
      <SortableListDemo />
      <SwipeDeckDemo />
      <TiltCardDemo />
      <PullToRefreshDemo />
      <ImageViewerDemo />
      <CountersRingsDemo />
      <SpringBonusDemo />
    </DemoPage>
  )
}
