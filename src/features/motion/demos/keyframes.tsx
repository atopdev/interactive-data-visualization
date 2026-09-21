import { motion, stagger, useAnimate } from 'motion/react'
import { Play } from 'lucide-react'
import { useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { Button } from '@/components/ui/button'

const TRANSITIONS = [
  {
    label: 'spring (bouncy)',
    transition: { type: 'spring', stiffness: 260, damping: 12 },
  },
  {
    label: 'spring (stiff)',
    transition: { type: 'spring', stiffness: 700, damping: 40 },
  },
  {
    label: 'tween easeInOut',
    transition: { type: 'tween', ease: 'easeInOut', duration: 0.8 },
  },
  {
    label: 'tween linear',
    transition: { type: 'tween', ease: 'linear', duration: 0.8 },
  },
  {
    label: 'inertia-like (backOut)',
    transition: { type: 'tween', ease: 'backOut', duration: 0.8 },
  },
] as const

export function KeyframesDemo() {
  const [side, setSide] = useState(false)
  const [scope, animate] = useAnimate<HTMLDivElement>()

  const sequence = async () => {
    // Imperative sequence: each step awaits the previous animation.
    await animate('[data-seq]', { scale: 0.6, opacity: 0.4 }, { duration: 0.2 })
    await animate(
      '[data-seq]',
      { y: -40, scale: 1, opacity: 1 },
      { delay: stagger(0.06), type: 'spring', stiffness: 400 },
    )
    await animate(
      '[data-seq]',
      { rotate: 360 },
      { duration: 0.6, delay: stagger(0.05, { from: 'last' }) },
    )
    await animate('[data-seq]', { y: 0, rotate: 0 }, { type: 'spring', bounce: 0.5 })
  }

  return (
    <DemoSection
      id="keyframes"
      index={10}
      title="Keyframes, spring vs tween, useAnimate"
      description="Left: a keyframe array with custom times runs forever. Middle: the same move with five transitions side by side, so you can feel the difference between physical springs and duration-based tweens. Right: useAnimate chains an imperative, awaited sequence with staggers."
      source="generated"
      controls={
        <>
          <Button size="sm" variant="outline" onClick={() => setSide((s) => !s)}>
            <Play /> Race
          </Button>
          <Button size="sm" variant="outline" onClick={() => void sequence()}>
            <Play /> Run sequence
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr_1fr]">
        <div className="bg-dot-grid grid h-64 place-items-center rounded-xl bg-surface-2">
          <motion.div
            className="size-16 bg-[var(--series-2)]"
            animate={{
              scale: [1, 1.4, 1.4, 1, 1],
              rotate: [0, 0, 180, 180, 0],
              borderRadius: ['20%', '20%', '50%', '50%', '20%'],
            }}
            transition={{
              duration: 2.4,
              ease: 'easeInOut',
              times: [0, 0.2, 0.5, 0.8, 1],
              repeat: Infinity,
              repeatDelay: 0.4,
            }}
          />
        </div>
        <div className="flex h-64 flex-col justify-center gap-3 rounded-xl bg-surface-2 p-4">
          {TRANSITIONS.map((t, i) => (
            <div key={t.label} className="flex items-center gap-3">
              <span className="w-40 shrink-0 font-mono text-[11px] text-muted-foreground">
                {t.label}
              </span>
              <div className="relative h-7 flex-1 rounded-full bg-muted">
                <motion.span
                  className="absolute top-0.5 size-6 rounded-full"
                  style={{ background: `var(--series-${i + 1})` }}
                  initial={false}
                  animate={{
                    left: side ? 'calc(100% - 1.625rem)' : '0.125rem',
                  }}
                  transition={t.transition}
                />
              </div>
            </div>
          ))}
        </div>
        <div
          ref={scope}
          className="bg-dot-grid flex h-64 items-center justify-center gap-2 rounded-xl bg-surface-2"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              data-seq
              className="size-9 rounded-lg"
              style={{ background: `var(--series-${i + 4})` }}
            />
          ))}
        </div>
      </div>
    </DemoSection>
  )
}
