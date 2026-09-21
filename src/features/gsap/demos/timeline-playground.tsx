import { FastForward, Pause, Play, Rewind, RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { gsap, useGSAP } from '../gsap'

const SPEEDS = ['0.25', '0.5', '1', '2'] as const
const LABELS = ['enter', 'spin', 'orbit', 'stack', 'exit']

export function TimelinePlaygroundDemo() {
  const scope = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(true)
  const [reversed, setReversed] = useState(false)
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>('1')
  const [markers, setMarkers] = useState<{ label: string; at: number }[]>([])

  useGSAP(
    () => {
      const tl = gsap.timeline({
        paused: true,
        defaults: { duration: 0.8, ease: 'power3.inOut' },
        onUpdate() {
          setProgress(this.progress())
        },
        onComplete: () => setPaused(true),
        onReverseComplete: () => setPaused(true),
      })
      tl.addLabel('enter')
        .from('[data-shape]', {
          y: 80,
          opacity: 0,
          scale: 0.4,
          stagger: 0.12,
          ease: 'back.out(2)',
        })
        .addLabel('spin')
        .to('[data-shape]', {
          rotation: 180,
          borderRadius: '50%',
          stagger: 0.08,
        })
        .addLabel('orbit')
        .to('[data-shape]', {
          x: (i) => Math.cos((i / 5) * Math.PI * 2) * 110,
          y: (i) => Math.sin((i / 5) * Math.PI * 2) * 70,
          duration: 1,
        })
        .to('[data-shape]', { rotation: 540, duration: 1.2, ease: 'none' }, '<')
        .addLabel('stack')
        .to('[data-shape]', {
          x: 0,
          y: (i) => (i - 2) * 16,
          scale: 0.8,
          borderRadius: '20%',
          stagger: 0.06,
        })
        .addLabel('exit')
        .to('[data-shape]', {
          x: 260,
          opacity: 0,
          stagger: 0.07,
          ease: 'power2.in',
        })
      tlRef.current = tl
      setMarkers(LABELS.map((l) => ({ label: l, at: tl.labels[l] / tl.duration() })))
    },
    { scope },
  )

  const tl = () => tlRef.current

  return (
    <DemoSection
      id="timeline"
      index={10}
      title="Timeline playground"
      description="One timeline with labeled sections. Play, pause, reverse, change timeScale, jump to a label, or scrub the playhead directly with the slider. Every control maps to a single Timeline method."
      source="generated"
      controls={
        <>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              onClick={() => {
                const t = tl()
                if (!t) return
                if (t.progress() === 1 && !t.reversed()) t.restart()
                else t.paused(!t.paused())
                if (t.reversed() && t.progress() === 0) t.reversed(false).play()
                setPaused(t.paused())
              }}
            >
              {paused ? <Play /> : <Pause />} {paused ? 'Play' : 'Pause'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const t = tl()
                if (!t) return
                t.reversed(!t.reversed()).play()
                setReversed(t.reversed())
                setPaused(false)
              }}
            >
              {reversed ? <FastForward /> : <Rewind />} {reversed ? 'Forward' : 'Reverse'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                tl()?.reversed(false).restart()
                setReversed(false)
                setPaused(false)
              }}
            >
              <RotateCcw /> Restart
            </Button>
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={speed}
            onValueChange={(v) => {
              if (!v) return
              setSpeed(v as (typeof SPEEDS)[number])
              tl()?.timeScale(Number(v))
            }}
            aria-label="Playback speed"
          >
            {SPEEDS.map((s) => (
              <ToggleGroupItem key={s} value={s} className="px-2.5 font-mono text-xs">
                {s}×
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </>
      }
    >
      <div ref={scope} className="flex flex-col gap-5">
        <div className="bg-dot-grid relative grid h-64 place-items-center overflow-hidden rounded-xl bg-surface-2">
          <div className="relative flex gap-3">
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                data-shape
                className="size-12 rounded-lg shadow-md"
                style={{ background: `var(--series-${i + 1})` }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Slider
            value={[progress]}
            min={0}
            max={1}
            step={0.001}
            aria-label="Timeline progress"
            onValueChange={([v]) => {
              const t = tl()
              if (!t) return
              t.pause().progress(v)
              setPaused(true)
            }}
          />
          <div className="relative h-6">
            {markers.map((m) => (
              <button
                key={m.label}
                type="button"
                onClick={() => {
                  tl()?.play(m.label)
                  setPaused(false)
                }}
                className="absolute -translate-x-1/2 rounded px-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
                style={{ left: `${m.at * 100}%` }}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="font-mono text-xs text-muted-foreground tabular-nums">
            progress {(progress * 100).toFixed(1)}% · timeScale {speed}× ·{' '}
            {reversed ? 'reversed' : 'forward'}
          </p>
        </div>
      </div>
    </DemoSection>
  )
}
