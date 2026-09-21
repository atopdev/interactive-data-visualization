import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useActiveSection } from '@/hooks/use-active-section'
import { neighbors, pageById, type PageId } from '@/lib/pages'
import { scrollToSection } from '@/lib/scroll-to-section'
import { useTransitionPhase } from '@/lib/transition-store'
import { cn } from '@/lib/utils'

export interface TocEntry {
  id: string
  title: string
}

interface DemoPageProps {
  pageId: PageId
  lead: ReactNode
  toc: readonly TocEntry[]
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
  hero,
  focus,
  demoCount,
  children,
}: DemoPageProps) {
  const page = pageById(pageId)
  const ids = useMemo(() => toc.map((t) => t.id), [toc])
  const scrolled = useActiveSection(ids)
  // While a TOC click is animating the scroll, pin the highlight to the target
  // so the indicator glides straight there instead of stepping through every
  // section passed on the way.
  const [pending, setPending] = useState<string | null>(null)
  const active = pending ?? scrolled
  const go = (id: string) => {
    setPending(id)
    scrollToSection(id, {
      onArrive: () => setPending(null),
      onInterrupt: () => setPending(null),
    })
  }

  // Sliding active-item indicator, positioned from the active link's box.
  const listRef = useRef<HTMLOListElement>(null)
  const [indicator, setIndicator] = useState<{
    top: number
    height: number
  } | null>(null)
  useLayoutEffect(() => {
    const link = listRef.current?.querySelector<HTMLElement>(`[data-toc-id="${active}"]`)
    setIndicator(link ? { top: link.offsetTop, height: link.offsetHeight } : null)
  }, [active])
  const { prev, next } = neighbors(pageId)
  // Wait for idle: ScrollTrigger refreshes (and pin spacers resize) after the reveal.
  const idle = useTransitionPhase() === 'idle'

  useEffect(() => {
    if (!idle || !focus) return
    const id = window.setTimeout(() => scrollToSection(focus), 250)
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
          <ol ref={listRef} className="relative flex flex-col border-l">
            {indicator && (
              <span
                aria-hidden
                className="absolute -left-px w-0.5 rounded-full bg-page-accent transition-[transform,height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={{
                  height: indicator.height,
                  transform: `translateY(${indicator.top}px)`,
                }}
              />
            )}
            {toc.map((entry, i) => (
              <li key={entry.id}>
                <a
                  href={`#${entry.id}`}
                  data-toc-id={entry.id}
                  onClick={(e) => {
                    // Plain anchors still work without JS; with JS we animate.
                    // Modified clicks keep their default (new tab, etc.).
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
                    e.preventDefault()
                    go(entry.id)
                  }}
                  aria-current={active === entry.id ? 'location' : undefined}
                  className={cn(
                    'flex gap-2 py-1.5 pl-3 text-sm text-muted-foreground transition-[color,transform] duration-300 hover:translate-x-0.5 hover:text-foreground',
                    active === entry.id && 'translate-x-1 font-medium text-foreground',
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
        </div>
      </div>
    </div>
  )
}
