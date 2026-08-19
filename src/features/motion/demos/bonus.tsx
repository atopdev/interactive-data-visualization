import { useQuery } from '@tanstack/react-query'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react'
import { ArrowDownRight, ArrowUpRight, RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { SmartImage } from '@/components/page/smart-image'
import { Button } from '@/components/ui/button'
import { useCoinbaseTicker } from '@/hooks/use-coinbase-ticker'
import { useInView } from '@/hooks/use-in-view'
import { usePageVisible } from '@/hooks/use-page-visible'
import { fakeProfiles, fakeWith } from '@/lib/fake'
import { picsum } from '@/lib/picsum'
import { candlesQuery } from '../queries'

const STACK = fakeProfiles('motion-stack', 5)
const QUOTE = fakeWith('motion-text-reveal', (f) => f.company.catchPhrase())

/** A 3D stack you can tilt; clicking sends the top card to the back. */
export function CardStack3D() {
  const [order, setOrder] = useState(STACK.map((_, i) => i))
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-18, 18]), {
    stiffness: 200,
    damping: 20,
  })
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [14, -14]), {
    stiffness: 200,
    damping: 20,
  })

  return (
    <div
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width - 0.5)
        my.set((e.clientY - r.top) / r.height - 0.5)
      }}
      onPointerLeave={() => {
        mx.set(0)
        my.set(0)
      }}
      className="bg-dot-grid grid h-80 place-items-center rounded-xl bg-surface-2"
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="relative h-52 w-40 sm:w-44"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      >
        {order.map((pi, depth) => {
          const p = STACK[pi]
          return (
            <motion.button
              key={p.id}
              type="button"
              layout
              onClick={() => setOrder((o) => [...o.slice(1), o[0]])}
              className="absolute inset-0 overflow-hidden rounded-2xl border bg-card text-left shadow-xl"
              animate={{ z: -depth * 40, y: -depth * 10, opacity: 1 - depth * 0.15 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              style={{ zIndex: STACK.length - depth }}
              aria-label={`${p.name}; send to back`}
            >
              <SmartImage
                src={picsum({ seed: p.avatarSeed, w: 360, h: 300 })}
                alt={`Portrait for ${p.name}`}
                width={360}
                height={300}
              />
              <div className="p-2.5">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{p.jobTitle}</p>
              </div>
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}

/** Per-character reveal with blur and a staggered spring. */
export function TextReveal() {
  const [run, setRun] = useState(0)
  const words = QUOTE.split(' ')
  let charIndex = 0
  return (
    <div className="flex h-80 flex-col items-center justify-center gap-4 rounded-xl bg-surface-2 p-6 text-center">
      <p
        key={run}
        className="max-w-md text-3xl leading-tight font-semibold tracking-tight"
        aria-label={QUOTE}
      >
        {words.map((word, wi) => (
          <span key={wi} className="inline-block whitespace-nowrap" aria-hidden>
            {[...word].map((ch) => {
              const i = charIndex++
              return (
                <motion.span
                  key={i}
                  className="inline-block"
                  initial={{ opacity: 0, y: 24, filter: 'blur(8px)', rotate: 8 }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)', rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 18,
                    delay: i * 0.025,
                  }}
                >
                  {ch}
                </motion.span>
              )
            })}
            {wi < words.length - 1 && ' '}
          </span>
        ))}
      </p>
      <Button size="sm" variant="ghost" onClick={() => setRun((r) => r + 1)}>
        <RotateCcw /> Replay
      </Button>
    </div>
  )
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

function Digit({ char }: { char: string }) {
  return (
    <span className="relative inline-block overflow-hidden align-bottom tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={char}
          className="inline-block"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/** BTC-USD over the Coinbase WebSocket; digits roll as the price changes. */
export function LiveTicker() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const visible = usePageVisible()
  const candles = useQuery(candlesQuery())
  const seed = candles.data?.data.candles.at(-1)?.close
  const ticker = useCoinbaseTicker({ enabled: inView && visible, seedPrice: seed })
  const price = ticker.price ?? seed ?? null
  const up = ticker.previous === null || price === null || price >= ticker.previous
  const open = candles.data?.data.candles.at(-1)?.open
  const change = price !== null && open ? ((price - open) / open) * 100 : null
  const text = price === null ? '—' : usd.format(price)

  return (
    <div
      ref={ref}
      className="flex h-80 flex-col items-center justify-center gap-3 rounded-xl bg-surface-2 p-6"
    >
      <p className="flex flex-wrap items-center justify-center gap-x-2 text-center font-mono text-xs text-muted-foreground">
        BTC-USD
        <span
          className={
            ticker.status === 'live'
              ? 'text-emerald-500'
              : ticker.status === 'simulated'
                ? 'text-amber-500'
                : ''
          }
        >
          {ticker.status === 'live'
            ? 'live via Coinbase WebSocket'
            : ticker.status === 'simulated'
              ? 'simulated (socket unavailable)'
              : ticker.status === 'idle'
                ? 'paused off-screen'
                : 'connecting…'}
        </span>
      </p>
      <p
        className={`flex text-4xl font-semibold tracking-tight sm:text-5xl ${up ? 'text-emerald-500' : 'text-red-500'} transition-colors`}
        aria-live="polite"
        aria-label={`Bitcoin price ${text}`}
      >
        {[...text].map((c, i) => (
          <Digit key={i} char={c} />
        ))}
      </p>
      {change !== null && (
        <p
          className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
        >
          {change >= 0 ? (
            <ArrowUpRight className="size-4" />
          ) : (
            <ArrowDownRight className="size-4" />
          )}
          {change.toFixed(2)}% today · {ticker.ticks} ticks received
        </p>
      )}
    </div>
  )
}

export function BonusDemo() {
  const candles = useQuery(candlesQuery())
  return (
    <DemoSection
      id="bonus"
      index={13}
      title="Bonus: 3D stack, text reveal, live price ticker"
      description="A pointer-tilted 3D card stack (preserve-3d with spring-smoothed rotation), a per-character reveal combining blur, rotation and stagger, and a live BTC-USD ticker whose digits roll with AnimatePresence. The whole page sits inside MotionConfig reducedMotion='user'."
      source={candles.data?.source ?? 'loading'}
      sourceReason={candles.data?.reason}
      sourceLabel="Coinbase WebSocket + Faker"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <CardStack3D />
        <TextReveal />
        <LiveTicker />
      </div>
    </DemoSection>
  )
}
