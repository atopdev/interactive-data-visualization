import { useQuery } from '@tanstack/react-query'
import { useMemo, useRef } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { Skeleton } from '@/components/ui/skeleton'
import { gsap, MOTION_OK, NO_MOTION, useGSAP } from '../gsap'
import { npmDownloadsQuery, quakesQuery } from '../queries'

interface Stat {
  label: string
  value: number
  decimals?: number
  suffix?: string
  hint: string
}

const compact = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function CountersDemo() {
  const scope = useRef<HTMLDivElement>(null)
  const npm = useQuery(npmDownloadsQuery())
  const quakes = useQuery(quakesQuery())

  const stats = useMemo<Stat[] | null>(() => {
    if (!npm.data || !quakes.data) return null
    const pkgs = npm.data.data.packages
    const gsapPkg = pkgs.find((p) => p.name === 'gsap')
    const total = pkgs.reduce((sum, p) => sum + p.downloads.reduce((a, b) => a + b, 0), 0)
    const q = quakes.data.data.quakes
    return [
      {
        label: 'gsap downloads, last 12 months',
        value: gsapPkg ? gsapPkg.downloads.reduce((a, b) => a + b, 0) : 0,
        hint: 'api.npmjs.org',
      },
      {
        label: 'All five libraries combined',
        value: total,
        hint: 'd3 · echarts · gsap · motion · react-spring',
      },
      {
        label: 'Earthquakes recorded this week',
        value: q.length,
        hint: 'USGS all_week feed',
      },
      {
        label: 'Strongest magnitude this week',
        value: q.reduce((m, x) => Math.max(m, x.mag), 0),
        decimals: 1,
        suffix: ' M',
        hint: q.reduce((best, x) => (x.mag > best.mag ? x : best), q[0])?.place ?? '',
      },
    ]
  }, [npm.data, quakes.data])

  useGSAP(
    () => {
      if (!stats) return
      const els = gsap.utils.toArray<HTMLElement>('[data-count]')
      const format = (el: HTMLElement, v: number) => {
        const decimals = Number(el.dataset.decimals ?? 0)
        el.textContent =
          (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en')) +
          (el.dataset.suffix ?? '')
      }
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        els.forEach((el) => {
          const counter = { v: 0 }
          gsap.to(counter, {
            v: Number(el.dataset.count),
            duration: 2.4,
            ease: 'expo.out',
            onUpdate: () => format(el, counter.v),
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          })
        })
      })
      mm.add(NO_MOTION, () => els.forEach((el) => format(el, Number(el.dataset.count))))
      return () => mm.revert()
    },
    { scope, dependencies: [stats] },
  )

  const source =
    npm.data && quakes.data
      ? npm.data.source === 'live' && quakes.data.source === 'live'
        ? 'live'
        : 'snapshot'
      : 'loading'

  return (
    <DemoSection
      id="counters"
      index={13}
      title="Animated counters from real data"
      description="Each number tweens a plain object from zero with an expo ease when it scrolls into view, formatting on every update. The values are real: npm download totals over the past year and this week's USGS earthquake feed."
      source={source}
      sourceReason={npm.data?.reason ?? quakes.data?.reason}
      sourceLabel="npm registry + USGS"
    >
      <div ref={scope} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats
          ? stats.map((s) => (
              <div key={s.label} className="rounded-xl border bg-surface-2 p-5">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p
                  data-count={s.value}
                  data-decimals={s.decimals}
                  data-suffix={s.suffix}
                  className="mt-2 text-[clamp(1.5rem,2.2vw,1.875rem)] font-semibold tracking-tight tabular-nums"
                  aria-label={`${s.label}: ${s.decimals ? s.value.toFixed(s.decimals) : compact.format(s.value)}`}
                >
                  0
                </p>
                <p className="mt-2 truncate text-xs text-muted-foreground">{s.hint}</p>
              </div>
            ))
          : Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
      </div>
    </DemoSection>
  )
}
