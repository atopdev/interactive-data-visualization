import { motion, type Variants } from 'motion/react'
import { BarChart3, Folder, Home, Inbox, Menu, Settings, Users, X } from 'lucide-react'
import { useState } from 'react'
import { SliderControl } from '@/components/page/control'
import { DemoSection } from '@/components/page/demo-section'
import { fakeWith } from '@/lib/fake'

const ICONS = [Home, Inbox, Folder, BarChart3, Users, Settings]
const ITEMS = fakeWith('motion-menu', (f) =>
  ['Overview', 'Inbox', 'Projects', 'Reports', 'Team', 'Settings'].map((label, i) => ({
    label,
    hint: i === 1 ? `${f.number.int({ min: 3, max: 24 })} new` : f.commerce.department(),
    Icon: ICONS[i],
  })),
)

export function VariantsMenuDemo() {
  const [open, setOpen] = useState(true)
  const [stagger, setStagger] = useState(0.06)
  const [delay, setDelay] = useState(0.15)

  const panel: Variants = {
    open: {
      clipPath: 'inset(0% 0% 0% 0% round 16px)',
      transition: {
        type: 'spring',
        bounce: 0,
        duration: 0.5,
        // Parent finishes opening before the children start.
        when: 'beforeChildren',
        delayChildren: delay,
        staggerChildren: stagger,
      },
    },
    closed: {
      clipPath: 'inset(0% 0% 100% 0% round 16px)',
      transition: {
        type: 'spring',
        bounce: 0,
        duration: 0.35,
        // Children exit (reverse order) before the panel collapses.
        when: 'afterChildren',
        staggerChildren: stagger / 2,
        staggerDirection: -1,
      },
    },
  }
  const item: Variants = {
    open: { opacity: 1, x: 0, filter: 'blur(0px)' },
    closed: { opacity: 0, x: -16, filter: 'blur(4px)' },
  }

  return (
    <DemoSection
      id="variants"
      index={3}
      title="Variants orchestration"
      description="One 'open'/'closed' state propagates through variants. The panel uses when: 'beforeChildren' plus delayChildren and staggerChildren to reveal its items, and 'afterChildren' with staggerDirection: -1 to close them in reverse first."
      source="generated"
      controls={
        <>
          <SliderControl
            label="staggerChildren"
            value={stagger}
            min={0}
            max={0.2}
            step={0.01}
            onChange={setStagger}
            format={(v) => `${v.toFixed(2)}s`}
          />
          <SliderControl
            label="delayChildren"
            value={delay}
            min={0}
            max={0.6}
            step={0.05}
            onChange={setDelay}
            format={(v) => `${v.toFixed(2)}s`}
          />
        </>
      }
    >
      <div className="bg-dot-grid flex min-h-[26rem] justify-center rounded-xl bg-surface-2 p-6">
        <motion.nav
          initial={false}
          animate={open ? 'open' : 'closed'}
          className="relative w-full max-w-xs"
          aria-label="Demo menu"
        >
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex w-full items-center justify-between rounded-2xl border bg-card px-4 py-3 text-sm font-medium shadow-sm"
          >
            Workspace
            <motion.span animate={{ rotate: open ? 90 : 0 }}>
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </motion.span>
          </button>
          <motion.ul
            variants={panel}
            className="mt-2 flex flex-col gap-1 border bg-card p-2 shadow-lg"
            style={{ pointerEvents: open ? 'auto' : 'none' }}
          >
            {ITEMS.map(({ label, hint, Icon }) => (
              <motion.li key={label} variants={item}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <Icon className="size-4 text-page-accent" />
                  <span className="flex-1">{label}</span>
                  <span className="text-xs text-muted-foreground">{hint}</span>
                </button>
              </motion.li>
            ))}
          </motion.ul>
        </motion.nav>
      </div>
    </DemoSection>
  )
}
