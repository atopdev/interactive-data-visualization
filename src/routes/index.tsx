import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import {
  lazy,
  Suspense,
  useRef,
  type ComponentType,
  type LazyExoticComponent,
} from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useInView } from '@/hooks/use-in-view'
import { PAGES, type PageId } from '@/lib/pages'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: Landing,
})

// Each preview is its own chunk, fetched only when its card scrolls into view,
// so the landing route never pulls in D3, ECharts, Motion or React Spring up front.
const PREVIEWS: Record<PageId, LazyExoticComponent<ComponentType>> = {
  d3: lazy(() => import('@/features/landing/previews/d3-preview')),
  echarts: lazy(() => import('@/features/landing/previews/echarts-preview')),
  gsap: lazy(() => import('@/features/landing/previews/gsap-preview')),
  'react-spring': lazy(() => import('@/features/landing/previews/spring-preview')),
  motion: lazy(() => import('@/features/landing/previews/motion-preview')),
  'react-bits': lazy(() => import('@/features/landing/previews/bits-preview')),
}

function LivePreview({ id }: { id: PageId }) {
  const ref = useRef<HTMLDivElement>(null)
  // Mounted only while visible: off-screen previews are unmounted and stop animating.
  const inView = useInView(ref, { rootMargin: '120px' })
  const Preview = PREVIEWS[id]
  return (
    <div
      ref={ref}
      className="bg-dot-grid relative h-48 overflow-hidden rounded-xl border bg-surface-2"
    >
      {inView && (
        <Suspense fallback={<Skeleton className="absolute inset-4" />}>
          <Preview />
        </Suspense>
      )}
    </div>
  )
}

const STATS = [
  { value: '6', label: 'libraries' },
  { value: '70+', label: 'live demos' },
  { value: '12', label: 'public data sources' },
  { value: '0', label: 'API keys' },
]

function Landing() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="accent-glow pointer-events-none absolute inset-x-0 top-0 h-[32rem]"
      />
      <section className="relative mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24">
        <p data-page-reveal className="text-sm font-medium text-muted-foreground">
          Interactive data visualization &amp; UI motion gallery
        </p>
        <h1
          data-page-heading
          className="mt-4 max-w-5xl text-5xl font-semibold tracking-tight text-balance sm:text-7xl"
        >
          Data that moves. Interfaces that feel alive.
        </h1>
        <p
          data-page-reveal
          className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground"
        >
          A tour through six animation and visualization libraries, driven by real public
          data: Nobel laureates, live Bitcoin trades, this week&apos;s earthquakes, a
          century of life expectancy, and plenty of seeded generated content.
        </p>
        <dl
          data-page-reveal
          className="mt-10 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4"
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <dt className="text-xs text-muted-foreground">{s.label}</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-label="Demo pages"
        className="relative mx-auto grid max-w-7xl gap-5 px-4 pb-24 sm:grid-cols-2 sm:px-6 lg:grid-cols-3"
      >
        {PAGES.map((page, i) => (
          <Link
            key={page.id}
            to={page.to}
            data-page-reveal
            className={cn(
              'group relative flex flex-col gap-4 rounded-2xl border bg-card p-4 transition-[transform,box-shadow,border-color] duration-300',
              'hover:-translate-y-1 hover:shadow-xl focus-visible:-translate-y-1',
            )}
            style={{ ['--card-accent' as string]: `var(${page.accentVar})` }}
          >
            <span
              aria-hidden
              className="absolute inset-x-6 top-0 h-px opacity-0 transition-opacity group-hover:opacity-100"
              style={{
                background:
                  'linear-gradient(90deg, transparent, var(--card-accent), transparent)',
              }}
            />
            <LivePreview id={page.id} />
            <div className="flex items-start justify-between gap-3 px-1 pb-1">
              <div>
                <p className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, '0')} · {page.group}
                </p>
                <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: 'var(--card-accent)' }}
                  />
                  {page.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {page.description}
                </p>
              </div>
              <ArrowRight className="mt-6 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
