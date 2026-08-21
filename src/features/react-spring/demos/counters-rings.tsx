import { animated, useSpring } from '@react-spring/web'
import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { Skeleton } from '@/components/ui/skeleton'
import { useInView } from '@/hooks/use-in-view'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { candlesQuery, weatherNowQuery } from '../queries'

interface RingProps {
  label: string
  value: number
  /** 0..1 fill of the ring. */
  fraction: number
  format: (v: number) => string
  color: string
  active: boolean
  hint: string
}

const R = 52
const C = 2 * Math.PI * R

function Ring({ label, value, fraction, format, color, active, hint }: RingProps) {
  const reduced = usePrefersReducedMotion()
  const { v, f } = useSpring({
    v: active ? value : 0,
    f: active ? fraction : 0,
    config: { tension: 120, friction: 26 },
    immediate: reduced,
  })
  return (
    <figure className="flex flex-col items-center gap-2 rounded-xl border bg-surface-2 p-4">
      <svg viewBox="0 0 128 128" className="size-32 -rotate-90" aria-hidden>
        <circle
          cx={64}
          cy={64}
          r={R}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={10}
        />
        <animated.circle
          cx={64}
          cy={64}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={f.to((x) => C * (1 - Math.min(1, Math.max(0, x))))}
        />
      </svg>
      <animated.p className="-mt-[5.6rem] mb-12 text-xl font-semibold tabular-nums">
        {v.to(format)}
      </animated.p>
      <figcaption className="text-center">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </figcaption>
      <span className="sr-only">
        {label}: {format(value)}
      </span>
    </figure>
  )
}

export function CountersRingsDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, threshold: 0.3 })
  const weather = useQuery(weatherNowQuery())
  const candles = useQuery(candlesQuery())
  const w = weather.data?.data
  const c = candles.data?.data.candles
  const last = c?.at(-1)
  const yearHigh = c ? Math.max(...c.map((x) => x.high)) : 0

  const source =
    weather.data && candles.data
      ? weather.data.source === 'live' && candles.data.source === 'live'
        ? 'live'
        : 'snapshot'
      : 'loading'

  return (
    <DemoSection
      id="counters"
      index={10}
      title="Number counters + SVG progress rings"
      description="Each ring's number and stroke-dashoffset share one spring, so they count up together when the section scrolls into view. The values are live: current London conditions from Open-Meteo and the latest BTC close from Coinbase (ring = share of its 300-day high)."
      source={source}
      sourceReason={weather.data?.reason ?? candles.data?.reason}
      sourceLabel="Open-Meteo + Coinbase"
    >
      <div ref={ref} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {w && last ? (
          <>
            <Ring
              label="Temperature"
              value={w.temperature}
              fraction={(w.temperature + 10) / 50}
              format={(v) => `${v.toFixed(1)}°C`}
              color="var(--series-2)"
              active={inView}
              hint={`${w.city}, feels ${Math.round(w.apparentTemperature)}°`}
            />
            <Ring
              label="Humidity"
              value={w.humidity}
              fraction={w.humidity / 100}
              format={(v) => `${Math.round(v)}%`}
              color="var(--series-1)"
              active={inView}
              hint="Relative humidity"
            />
            <Ring
              label="Wind"
              value={w.windSpeed}
              fraction={w.windSpeed / 60}
              format={(v) => `${v.toFixed(1)}`}
              color="var(--series-3)"
              active={inView}
              hint="km/h at 10 m"
            />
            <Ring
              label="BTC-USD"
              value={last.close}
              fraction={last.close / yearHigh}
              format={(v) => `$${Math.round(v / 100) / 10}k`}
              color="var(--series-4)"
              active={inView}
              hint={`${Math.round((last.close / yearHigh) * 100)}% of period high`}
            />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-60 rounded-xl" />
          ))
        )}
      </div>
    </DemoSection>
  )
}
