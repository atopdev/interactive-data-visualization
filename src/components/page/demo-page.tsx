import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import { useEffect, useMemo, type ReactNode } from 'react'
import { useActiveSection } from '@/hooks/use-active-section'
import { neighbors, pageById, type PageId } from '@/lib/pages'
import { useTransitionPhase } from '@/lib/transition-store'
import { cn } from '@/lib/utils'

export interface TocEntry {
  id: string
  title: string
}

export interface DataCredit {
  name: string
  url: string
  note: string
}

interface DemoPageProps {
  pageId: PageId
  lead: ReactNode
  toc: readonly TocEntry[]
  credits: readonly DataCredit[]
  /** Optional hero content rendered under the lead (e.g. stats, a live background). */
  hero?: ReactNode
  /** Section id to scroll to once the page has been revealed (?demo=<id>). */
  focus?: string
  /** Shown in the eyebrow; defaults to the number of TOC entries. */
  demoCount?: number
  children: ReactNode
}

/** Shared layout for the six demo pages. */
export function DemoPage({
  pageId,
  lead,
  toc,
  credits,
  hero,
  focus,
  demoCount,
  children,
}: DemoPageProps) {
  const page = pageById(pageId)
  const ids = useMemo(() => toc.map((t) => t.id), [toc])
  const active = useActiveSection(ids)
  const { prev, next } = neighbors(pageId)
  // Wait for idle: ScrollTrigger refreshes (and pin spacers resize) after the reveal.
  const idle = useTransitionPhase() === 'idle'

  useEffect(() => {
    if (!idle || !focus) return
    const id = window.setTimeout(
      () =>
        document
          .getElementById(focus)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      250,
    )
    return () => window.clearTimeout(id)
    // Only on first reveal: later search-param changes must not yank the scroll position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idle])

  return (
    <div className="relative">
      <div
        aria-hidden
        className="accent-glow pointer-events-none absolute inset-x-0 top-0 h-[28rem]"
      />
      <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-10 sm:px-6 sm:pt-16">
        <p
          data-page-reveal
          className="flex items-center gap-2 text-sm font-medium text-page-accent"
        >
          <span className="size-2 rounded-full bg-page-accent" />
          {page.group} · {demoCount ?? toc.length} demos
        </p>
        <h1
          data-page-heading
          className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
        >
          {page.title}
        </h1>
        <div
          data-page-reveal
          className="mt-4 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg"
        >
          {lead}
        </div>
        {hero && (
          <div data-page-reveal className="mt-8">
            {hero}
          </div>
        )}
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav
          aria-label="On this page"
          className="top-20 hidden self-start lg:sticky lg:block"
          data-page-reveal
        >
          <p className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            On this page
          </p>
          <ol className="relative flex flex-col border-l">
            {toc.map((entry, i) => (
              <li key={entry.id}>
                <a
                  href={`#${entry.id}`}
                  aria-current={active === entry.id ? 'location' : undefined}
                  className={cn(
                    '-ml-px flex gap-2 border-l-2 border-transparent py-1.5 pl-3 text-sm text-muted-foreground transition-colors hover:text-foreground',
                    active === entry.id &&
                      'border-page-accent font-medium text-foreground',
                  )}
                >
                  <span className="font-mono text-xs tabular-nums opacity-60">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {entry.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex min-w-0 flex-col gap-10">
          {children}

          <nav
            aria-label="Pagination"
            className="grid gap-3 border-t pt-10 sm:grid-cols-2"
          >
            <Link
              to={prev.to}
              className="group flex flex-col gap-1 rounded-2xl border p-5 transition-colors hover:bg-accent"
            >
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                Previous
              </span>
              <span className="font-semibold" style={{ color: `var(${prev.accentVar})` }}>
                {prev.title}
              </span>
              <span className="text-sm text-muted-foreground">{prev.tagline}</span>
            </Link>
            <Link
              to={next.to}
              className="group flex flex-col items-end gap-1 rounded-2xl border p-5 text-right transition-colors hover:bg-accent"
            >
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Next
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="font-semibold" style={{ color: `var(${next.accentVar})` }}>
                {next.title}
              </span>
              <span className="text-sm text-muted-foreground">{next.tagline}</span>
            </Link>
          </nav>

          <footer
            aria-labelledby="data-sources"
            className="rounded-2xl border bg-surface-2 p-5 sm:p-6"
          >
            <h2 id="data-sources" className="text-sm font-semibold">
              Data sources
            </h2>
            <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {credits.map((c) => (
                <li key={c.name} className="flex flex-col">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium hover:underline"
                  >
                    {c.name}
                    <ExternalLink className="size-3" />
                  </a>
                  <span className="text-muted-foreground">{c.note}</span>
                </li>
              ))}
            </ul>
          </footer>
        </div>
      </div>
    </div>
  )
}
