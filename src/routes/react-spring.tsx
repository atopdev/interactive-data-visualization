import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { DemoPage, type DataCredit, type TocEntry } from '@/components/page/demo-page'
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

const CREDITS: DataCredit[] = [
  {
    name: 'Open-Meteo',
    url: 'https://open-meteo.com',
    note: 'Current conditions for pull-to-refresh and the rings (CC BY 4.0)',
  },
  {
    name: 'Coinbase Exchange API',
    url: 'https://docs.cdp.coinbase.com/exchange/docs/welcome',
    note: 'Daily BTC-USD candles',
  },
  { name: 'Lorem Picsum', url: 'https://picsum.photos', note: 'Seeded photographs' },
  { name: 'Faker', url: 'https://fakerjs.dev', note: 'Seeded people, songs and copy' },
]

function ReactSpringPage() {
  const { demo } = Route.useSearch()
  return (
    <DemoPage
      pageId="react-spring"
      focus={demo}
      lead={
        <>
          React Spring animates with physics instead of durations and easing curves.
          Paired with <code className="font-mono text-sm">@use-gesture/react</code>,
          springs pick up the velocity of a drag, so throws, flicks and rubber bands feel
          physical. With reduced motion enabled, every spring on this page jumps straight
          to its target via the <code className="font-mono text-sm">immediate</code> flag.
        </>
      }
      toc={TOC}
      credits={CREDITS}
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
