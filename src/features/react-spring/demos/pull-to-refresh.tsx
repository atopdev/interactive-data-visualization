import { animated, useSpring } from '@react-spring/web'
import { useQuery } from '@tanstack/react-query'
import { useDrag } from '@use-gesture/react'
import { ArrowDown, CloudSun, Loader2, RefreshCw } from 'lucide-react'
import { DemoSection } from '@/components/page/demo-section'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { weatherNowQuery } from '../queries'

const THRESHOLD = 90
const MAX_PULL = 160

export function PullToRefreshDemo() {
  const reduced = usePrefersReducedMotion()
  const weather = useQuery(weatherNowQuery())
  const [{ y }, api] = useSpring(() => ({ y: 0 }))
  const refreshing = weather.isFetching

  const bind = useDrag(
    ({ active, movement: [, my], cancel }) => {
      if (refreshing) return cancel()
      // Rubber band: past the max, the panel resists with a logarithmic falloff.
      const pull =
        my <= 0 ? 0 : my < MAX_PULL ? my : MAX_PULL + Math.log1p(my - MAX_PULL) * 12
      if (active) {
        api.start({ y: pull, immediate: true })
        return
      }
      if (pull > THRESHOLD) {
        api.start({ y: 64, immediate: reduced })
        void weather.refetch().finally(() => api.start({ y: 0, immediate: reduced }))
      } else {
        api.start({ y: 0, immediate: reduced, config: { tension: 400, friction: 22 } })
      }
    },
    { axis: 'y', filterTaps: true, pointer: { touch: true } },
  )

  const d = weather.data?.data
  const fetchedAt = weather.data
    ? new Date(weather.data.fetchedAt).toLocaleTimeString()
    : '—'

  return (
    <DemoSection
      id="pull"
      index={8}
      title="Pull to refresh (rubber band)"
      description="Drag the panel down. It follows your pointer 1:1 up to a limit, then resists with a rubber-band falloff. Release past the threshold and it holds open while TanStack Query actually refetches live conditions from Open-Meteo, then springs back."
      source={weather.data?.source ?? 'loading'}
      sourceReason={weather.data?.reason}
      sourceLabel="Open-Meteo forecast API"
    >
      <div className="relative mx-auto h-96 max-w-sm overflow-hidden rounded-3xl border bg-surface-2">
        <animated.div
          className="absolute inset-x-0 top-0 flex h-16 items-center justify-center gap-2 text-sm text-muted-foreground"
          style={{ opacity: y.to([0, THRESHOLD], [0, 1]) }}
        >
          {refreshing ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Refreshing…
            </>
          ) : (
            <>
              <animated.span style={{ rotate: y.to([0, THRESHOLD], [0, 180], 'clamp') }}>
                <ArrowDown className="size-4" />
              </animated.span>
              <animated.span>
                {y.to((v) => (v > THRESHOLD ? 'Release to refresh' : 'Pull to refresh'))}
              </animated.span>
            </>
          )}
        </animated.div>
        <animated.div
          {...bind()}
          className="absolute inset-0 flex cursor-grab touch-none flex-col gap-4 rounded-3xl border-t bg-card p-6 shadow-lg select-none active:cursor-grabbing"
          style={{ y }}
        >
          <div className="mx-auto h-1 w-10 rounded-full bg-muted" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {d?.city ?? 'Loading'} · now
              </p>
              <p className="mt-1 text-6xl font-semibold tracking-tight tabular-nums">
                {d ? `${Math.round(d.temperature)}°` : '—'}
              </p>
              <p className="text-sm text-muted-foreground">
                Feels like {d ? `${Math.round(d.apparentTemperature)}°` : '—'}
              </p>
            </div>
            <CloudSun className="size-16 text-page-accent" />
          </div>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Humidity', d ? `${d.humidity}%` : '—'],
              ['Wind', d ? `${Math.round(d.windSpeed)} km/h` : '—'],
              ['Clouds', d ? `${d.cloudCover}%` : '—'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-surface-2 p-2">
                <dt className="text-[11px] text-muted-foreground">{k}</dt>
                <dd className="text-sm font-medium tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-auto flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCw className="size-3" /> Last fetched {fetchedAt}
          </p>
        </animated.div>
      </div>
    </DemoSection>
  )
}
