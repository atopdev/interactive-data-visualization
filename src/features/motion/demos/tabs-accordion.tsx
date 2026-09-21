import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { fakeWith } from '@/lib/fake'
import { cn } from '@/lib/utils'

const TABS = fakeWith('motion-tabs', (f) =>
  ['Overview', 'Activity', 'Billing', 'Members'].map((label) => ({
    label,
    heading: f.company.catchPhrase(),
    body: `${f.company.buzzPhrase()}. ${f.hacker.phrase()}`,
  })),
)

const FAQ = fakeWith('motion-accordion', (f) =>
  Array.from({ length: 4 }, () => ({
    q: `How do we ${f.hacker.verb()} the ${f.hacker.adjective()} ${f.hacker.noun()}?`,
    a: Array.from({ length: f.number.int({ min: 1, max: 3 }) }, () =>
      f.hacker.phrase(),
    ).join(' '),
  })),
)

export function TabsAccordionDemo() {
  const [tab, setTab] = useState(0)
  const [open, setOpen] = useState<number | null>(0)

  return (
    <DemoSection
      id="tabs"
      index={11}
      title="Sliding tab indicator + height: auto accordion"
      description="The active tab's pill is a single element with a shared layoutId, so it glides between tabs instead of cross-fading. Accordion panels animate height to 'auto' (Motion measures the content), with AnimatePresence handling the collapse."
      source="generated"
      sourceLabel="Faker copy"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-surface-2 p-4">
          <div
            role="tablist"
            aria-label="Demo tabs"
            className="flex gap-1 rounded-full border bg-card p-1"
          >
            {TABS.map((t, i) => (
              <button
                key={t.label}
                role="tab"
                type="button"
                aria-selected={tab === i}
                onClick={() => setTab(i)}
                className={cn(
                  'relative flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  tab === i
                    ? 'text-background'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab === i && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full bg-foreground"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative">{t.label}</span>
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            className="relative mt-4 min-h-36 overflow-hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border bg-card p-4"
              >
                <p className="font-medium">{TABS[tab].heading}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {TABS[tab].body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl bg-surface-2 p-4">
          {FAQ.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-lg border bg-card"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium"
                >
                  {item.q}
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                    >
                      <p className="px-4 pb-4 text-sm text-muted-foreground">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </DemoSection>
  )
}
