import { AnimatePresence, motion } from 'motion/react'
import { Bell, Check, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { Button } from '@/components/ui/button'
import { fakeNotifications, fakeWith, type FakeNotification } from '@/lib/fake'
import { cn } from '@/lib/utils'

const POOL = fakeNotifications('motion-notifications', 40)
const STEPS = fakeWith('motion-stepper', (f) =>
  ['Account', 'Workspace', 'Invite', 'Done'].map((label) => ({
    label,
    body: f.company.catchPhrase(),
    detail: f.hacker.phrase(),
  })),
)

export function PresenceDemo() {
  const [items, setItems] = useState<FakeNotification[]>(() => POOL.slice(0, 3))
  const [cursor, setCursor] = useState(3)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  const add = () => {
    setItems((prev) => [POOL[cursor % POOL.length], ...prev].slice(0, 5))
    setCursor((c) => c + 1)
  }
  const go = (delta: number) => {
    setDirection(delta)
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + delta)))
  }

  return (
    <DemoSection
      id="presence"
      index={2}
      title="AnimatePresence: popLayout and wait"
      description="Left: mode='popLayout' pops exiting notifications out of the layout immediately, so the survivors reflow with layout animations while the leaver slides away. Right: mode='wait' finishes each step's exit before the next one enters, with the direction taken from a custom prop."
      source="generated"
      sourceLabel="Faker notifications"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl bg-surface-2 p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Bell className="size-4" /> Notifications
            </p>
            <Button size="sm" variant="outline" onClick={add}>
              <Plus /> Add
            </Button>
          </div>
          <ul className="relative flex min-h-80 flex-col gap-2">
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((n) => (
                <motion.li
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: -24, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 80, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="flex items-start gap-3 rounded-lg border bg-card p-3 shadow-xs"
                >
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-page-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {n.author} · {n.time}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((x) => x.id !== n.id))}
                    className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted"
                    aria-label={`Dismiss ${n.title}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        <div className="flex flex-col gap-4 rounded-xl bg-surface-2 p-4">
          <ol className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <li key={s.label} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-medium transition-colors',
                    i < step && 'border-page-accent bg-page-accent text-background',
                    i === step && 'border-page-accent text-page-accent',
                  )}
                >
                  {i < step ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className="hidden text-xs sm:inline">{s.label}</span>
                {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
              </li>
            ))}
          </ol>
          <div className="relative min-h-48 overflow-hidden rounded-lg border bg-card p-5">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={step}
                custom={direction}
                variants={{
                  enter: (d: number) => ({ x: d * 60, opacity: 0 }),
                  center: { x: 0, opacity: 1 },
                  exit: (d: number) => ({ x: d * -60, opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <p className="font-mono text-xs text-muted-foreground">
                  Step {step + 1} of {STEPS.length}
                </p>
                <p className="mt-2 text-lg font-semibold">{STEPS[step].label}</p>
                <p className="mt-1 text-sm">{STEPS[step].body}</p>
                <p className="mt-3 text-sm text-muted-foreground">{STEPS[step].detail}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex justify-between">
            <Button
              size="sm"
              variant="outline"
              onClick={() => go(-1)}
              disabled={step === 0}
            >
              <ChevronLeft /> Back
            </Button>
            <Button size="sm" onClick={() => go(1)} disabled={step === STEPS.length - 1}>
              Next <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
    </DemoSection>
  )
}
