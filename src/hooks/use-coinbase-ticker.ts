import { useEffect, useRef, useState } from 'react'
import { seededRandom } from '@/lib/random'
import { COINBASE_WS_URL, tickerMessageSchema } from '@/lib/sources/crypto'

export interface Tick {
  price: number
  /** Epoch ms. */
  time: number
}

type TickerStatus = 'idle' | 'connecting' | 'live' | 'simulated'

export interface TickerState {
  price: number | null
  previous: number | null
  status: TickerStatus
  ticks: number
}

interface Options {
  product?: string
  /** Close the socket while false (off-screen, hidden tab). */
  enabled: boolean
  /** Starting price for the simulated fallback (e.g. the last daily close). */
  seedPrice?: number
  /** Receives every tick that arrived since the previous animation frame. */
  onFrame?: (ticks: Tick[]) => void
}

const MAX_ATTEMPTS = 4
const FIRST_MESSAGE_TIMEOUT = 6000

/**
 * Coinbase Exchange `ticker` channel over WebSocket.
 *
 * - Messages are buffered and flushed once per animation frame, so a burst
 *   of trades causes one React render (and one chart update) per frame.
 * - Reconnects with exponential backoff; after repeated failures (or no
 *   data) it switches to a seeded random-walk simulation.
 * - The socket is closed whenever `enabled` turns false and on unmount.
 */
export function useCoinbaseTicker({
  product = 'BTC-USD',
  enabled,
  seedPrice,
  onFrame,
}: Options): TickerState {
  const [state, setState] = useState<TickerState>({
    price: null,
    previous: null,
    status: 'connecting',
    ticks: 0,
  })
  const onFrameRef = useRef(onFrame)
  const seedRef = useRef(seedPrice)
  useEffect(() => {
    onFrameRef.current = onFrame
    seedRef.current = seedPrice
  })

  useEffect(() => {
    if (!enabled) return
    let socket: WebSocket | null = null
    let attempts = 0
    let disposed = false
    let simulated = false
    let raf = 0
    let retryTimer = 0
    let watchdog = 0
    let simTimer = 0
    const buffer: Tick[] = []
    let last: number | null = null

    const flush = () => {
      raf = 0
      if (!buffer.length) return
      const batch = buffer.splice(0)
      const latest = batch[batch.length - 1].price
      onFrameRef.current?.(batch)
      setState((s) => ({
        price: latest,
        previous: s.price ?? last,
        status: simulated ? 'simulated' : 'live',
        ticks: s.ticks + batch.length,
      }))
      last = latest
    }
    const push = (tick: Tick) => {
      buffer.push(tick)
      if (!raf) raf = requestAnimationFrame(flush)
    }

    const startSimulation = () => {
      if (simulated || disposed) return
      simulated = true
      socket?.close()
      const rand = seededRandom(`ticker-${product}`)
      let price = last ?? seedRef.current ?? 60_000
      setState((s) => ({ ...s, status: 'simulated' }))
      simTimer = window.setInterval(() => {
        // Geometric random walk with occasional bursts.
        const shock = (rand() - 0.5) * 0.0016 * (rand() > 0.94 ? 4 : 1)
        price = Math.max(1, price * (1 + shock))
        push({ price, time: Date.now() })
      }, 350)
    }

    const connect = () => {
      if (disposed || simulated) return
      try {
        socket = new WebSocket(COINBASE_WS_URL)
      } catch {
        scheduleRetry()
        return
      }
      watchdog = window.setTimeout(() => {
        // Connected but silent (or blocked): fall back rather than wait forever.
        if (last === null) startSimulation()
      }, FIRST_MESSAGE_TIMEOUT)
      socket.onopen = () => {
        socket?.send(
          JSON.stringify({
            type: 'subscribe',
            product_ids: [product],
            channels: ['ticker'],
          }),
        )
      }
      socket.onmessage = (event: MessageEvent<string>) => {
        let json: unknown
        try {
          json = JSON.parse(event.data)
        } catch {
          return
        }
        const parsed = tickerMessageSchema.safeParse(json)
        if (!parsed.success) return
        attempts = 0
        const time = parsed.data.time
          ? Date.parse(parsed.data.time)
          : Date.now()
        push({ price: parsed.data.price, time })
      }
      socket.onclose = () => {
        window.clearTimeout(watchdog)
        if (!disposed && !simulated) scheduleRetry()
      }
      socket.onerror = () => socket?.close()
    }

    const scheduleRetry = () => {
      attempts++
      if (attempts >= MAX_ATTEMPTS) {
        startSimulation()
        return
      }
      const delay = Math.min(30_000, 1000 * 2 ** (attempts - 1))
      retryTimer = window.setTimeout(connect, delay)
    }

    // No network at all: skip the retry ladder and simulate straight away.
    if (!navigator.onLine) startSimulation()
    else connect()
    return () => {
      disposed = true
      window.clearTimeout(retryTimer)
      window.clearTimeout(watchdog)
      window.clearInterval(simTimer)
      cancelAnimationFrame(raf)
      if (socket) {
        socket.onclose = null
        socket.onmessage = null
        // Closing mid-handshake logs a browser warning; close once it opens instead.
        if (socket.readyState === WebSocket.CONNECTING) {
          const pending = socket
          pending.onopen = () => pending.close()
        } else {
          socket.close()
        }
      }
    }
  }, [enabled, product])

  // Paused while disabled; 'connecting' until the first tick arrives.
  return enabled ? state : { ...state, status: 'idle' }
}
