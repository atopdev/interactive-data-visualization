import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { DemoPage, type DataCredit, type TocEntry } from '@/components/page/demo-page'
import {
  ClickSparkShowcase,
  MagnetShowcase,
  PixelTrailShowcase,
  SplashCursorShowcase,
  StarBorderShowcase,
} from '@/features/react-bits/demos/animation-demos'
import { BACKGROUNDS } from '@/features/react-bits/backgrounds'
import { BackgroundHero } from '@/features/react-bits/demos/background-hero'
import {
  CircularGalleryShowcase,
  DockShowcase,
  FlowingMenuShowcase,
  MasonryShowcase,
  SpotlightCardShowcase,
  StackShowcase,
  TiltedCardShowcase,
} from '@/features/react-bits/demos/component-demos'
import {
  BlurTextShowcase,
  CircularTextShowcase,
  CountUpShowcase,
  DecryptedTextShowcase,
  GradientTextShowcase,
  ScrollRevealShowcase,
  ShinyTextShowcase,
  SplitTextShowcase,
  TextPressureShowcase,
} from '@/features/react-bits/demos/text-demos'
import { npmDownloadsQuery } from '@/features/react-bits/queries'
import { CategoryHeader } from '@/features/react-bits/showcase'
import { ensureWithBudget } from '@/lib/query'

export const Route = createFileRoute('/react-bits')({
  validateSearch: z.object({
    demo: z.string().optional().catch(undefined),
    bg: z.enum(BACKGROUNDS).optional().catch(undefined),
  }),
  loader: ({ context: { queryClient } }) =>
    ensureWithBudget([queryClient.ensureQueryData(npmDownloadsQuery())]),
  component: ReactBitsPage,
})

const TOC: TocEntry[] = [
  { id: 'backgrounds', title: 'Backgrounds' },
  { id: 'text-animations', title: 'Text animations' },
  { id: 'animations', title: 'Animations' },
  { id: 'components', title: 'Components' },
]

const CREDITS: DataCredit[] = [
  {
    name: 'React Bits',
    url: 'https://reactbits.dev',
    note: 'Components installed via the shadcn registry (TS + Tailwind variants)',
  },
  {
    name: 'npm registry downloads API',
    url: 'https://github.com/npm/registry/blob/main/docs/download-counts.md',
    note: 'Combined downloads for the CountUp demo',
  },
  {
    name: 'Lorem Picsum',
    url: 'https://picsum.photos',
    note: 'Seeded gallery photographs',
  },
  { name: 'Faker', url: 'https://fakerjs.dev', note: 'Seeded names, cities and copy' },
]

function ReactBitsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const npm = useQuery(npmDownloadsQuery())
  const total =
    npm.data?.data.packages.reduce(
      (s, p) => s + p.downloads.reduce((a, b) => a + b, 0),
      0,
    ) ?? 0

  return (
    <DemoPage
      pageId="react-bits"
      focus={search.demo}
      demoCount={28}
      lead={
        <>
          React Bits components are copied into the codebase with{' '}
          <code className="font-mono text-sm">npx shadcn add @react-bits/…-TS-TW</code>,
          then owned like any other source. Each card below exposes the component&apos;s
          props as live controls and a copy-ready usage snippet. The page never holds more
          than one live WebGL context: the most visible WebGL demo runs while the others
          pause and dispose theirs.
        </>
      }
      toc={TOC}
      credits={CREDITS}
    >
      <BackgroundHero
        background={search.bg ?? 'aurora'}
        onChange={(bg) =>
          void navigate({
            search: (prev) => ({ ...prev, bg }),
            replace: true,
            resetScroll: false,
          })
        }
      />

      <CategoryHeader
        id="text-animations"
        title="Text animations"
        description="Nine typographic effects driven by GSAP, Motion and variable fonts."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <SplitTextShowcase />
        <BlurTextShowcase />
        <ShinyTextShowcase />
        <DecryptedTextShowcase />
        <GradientTextShowcase />
        <CircularTextShowcase />
        <TextPressureShowcase />
        {npm.data ? (
          <CountUpShowcase
            total={total}
            source={npm.data.source}
            sourceReason={npm.data.reason}
          />
        ) : (
          <div className="min-h-64 animate-pulse rounded-2xl border bg-card" />
        )}
      </div>
      <ScrollRevealShowcase />

      <CategoryHeader
        id="animations"
        title="Animations"
        description="Pointer-driven micro-interactions. The two WebGL effects are off until you enable them."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <ClickSparkShowcase />
        <MagnetShowcase />
        <StarBorderShowcase />
        <SplashCursorShowcase />
      </div>
      <PixelTrailShowcase />

      <CategoryHeader
        id="components"
        title="Components"
        description="Larger interactive building blocks: docks, galleries, stacks, cards and menus."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <DockShowcase />
        <TiltedCardShowcase />
        <StackShowcase />
        <SpotlightCardShowcase />
      </div>
      <CircularGalleryShowcase />
      <FlowingMenuShowcase />
      <MasonryShowcase />
    </DemoPage>
  )
}
