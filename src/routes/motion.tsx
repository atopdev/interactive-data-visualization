import { createFileRoute } from '@tanstack/react-router'
import { MotionConfig } from 'motion/react'
import { z } from 'zod'
import { DemoPage, type DataCredit, type TocEntry } from '@/components/page/demo-page'
import { BonusDemo } from '@/features/motion/demos/bonus'
import { DragPhysicsDemo } from '@/features/motion/demos/drag-physics'
import { GesturesDemo } from '@/features/motion/demos/gestures'
import { KeyframesDemo } from '@/features/motion/demos/keyframes'
import { MasonryFilterDemo } from '@/features/motion/demos/masonry-filter'
import { PresenceDemo } from '@/features/motion/demos/presence'
import { ReorderDemo } from '@/features/motion/demos/reorder-list'
import {
  ScrollLinkedDemo,
  ScrollProgressBar,
} from '@/features/motion/demos/scroll-linked'
import { SharedLayoutDemo } from '@/features/motion/demos/shared-layout'
import { SvgPathsDemo } from '@/features/motion/demos/svg-paths'
import { TabsAccordionDemo } from '@/features/motion/demos/tabs-accordion'
import { VariantsMenuDemo } from '@/features/motion/demos/variants-menu'
import { VelocityDemo } from '@/features/motion/demos/velocity'
import { candlesQuery } from '@/features/motion/queries'
import { ensureWithBudget } from '@/lib/query'

export const Route = createFileRoute('/motion')({
  validateSearch: z.object({ demo: z.string().optional().catch(undefined) }),
  loader: ({ context: { queryClient } }) =>
    ensureWithBudget([queryClient.ensureQueryData(candlesQuery())]),
  component: MotionPage,
})

const TOC: TocEntry[] = [
  { id: 'shared-layout', title: 'Shared layout' },
  { id: 'presence', title: 'AnimatePresence' },
  { id: 'variants', title: 'Variants' },
  { id: 'reorder', title: 'Reorder' },
  { id: 'drag', title: 'Drag physics' },
  { id: 'gestures', title: 'Gestures' },
  { id: 'scroll-linked', title: 'Scroll-linked' },
  { id: 'velocity', title: 'Velocity' },
  { id: 'svg', title: 'SVG paths' },
  { id: 'keyframes', title: 'Keyframes & springs' },
  { id: 'tabs', title: 'Tabs & accordion' },
  { id: 'layout-group', title: 'LayoutGroup' },
  { id: 'bonus', title: 'Bonus' },
]

const CREDITS: DataCredit[] = [
  {
    name: 'Coinbase Exchange API',
    url: 'https://docs.cdp.coinbase.com/exchange/docs/websocket-overview',
    note: 'BTC-USD ticker WebSocket and daily candles',
  },
  {
    name: 'Binance public data mirror',
    url: 'https://data-api.binance.vision',
    note: 'Backup daily candles',
  },
  {
    name: 'Lorem Picsum',
    url: 'https://picsum.photos',
    note: 'Seeded photographs for galleries and parallax',
  },
  { name: 'Faker', url: 'https://fakerjs.dev', note: 'Seeded names, products and copy' },
]

function MotionPage() {
  const { demo } = Route.useSearch()
  return (
    // Honor the OS reduced-motion setting for every animation on this page:
    // transforms/layout become instant while opacity/color still fade.
    <MotionConfig reducedMotion="user">
      <ScrollProgressBar />
      <DemoPage
        pageId="motion"
        focus={demo}
        lead={
          <>
            Motion (formerly Framer Motion, now imported from{' '}
            <code className="font-mono text-sm">motion/react</code>) animates React with
            declarative props: layout and shared-element transitions, presence,
            orchestration, gestures, drag physics and scroll-linked motion values that
            update without re-rendering.
          </>
        }
        toc={TOC}
        credits={CREDITS}
      >
        <SharedLayoutDemo />
        <PresenceDemo />
        <VariantsMenuDemo />
        <ReorderDemo />
        <DragPhysicsDemo />
        <GesturesDemo />
        <ScrollLinkedDemo />
        <VelocityDemo />
        <SvgPathsDemo />
        <KeyframesDemo />
        <TabsAccordionDemo />
        <MasonryFilterDemo />
        <BonusDemo />
      </DemoPage>
    </MotionConfig>
  )
}
