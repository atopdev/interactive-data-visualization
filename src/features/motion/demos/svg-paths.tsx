import { AnimatePresence, motion } from 'motion/react'
import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { Button } from '@/components/ui/button'

// Morph targets share the same command structure (M + 4×C + Z), which is
// what lets Motion interpolate the `d` attribute point by point.
const MORPHS = [
  {
    name: 'Drop',
    d: 'M60 8 C80 40 104 60 104 82 C104 106 84 116 60 116 C36 116 16 106 16 82 C16 60 40 40 60 8 Z',
  },
  {
    name: 'Leaf',
    d: 'M60 8 C96 22 112 58 100 90 C92 108 76 116 60 116 C44 116 28 108 20 90 C8 58 24 22 60 8 Z',
  },
  {
    name: 'Square',
    d: 'M60 14 C86 14 106 14 106 40 C106 66 106 106 80 106 C60 106 20 106 14 80 C14 60 14 14 60 14 Z',
  },
  {
    name: 'Burst',
    d: 'M60 4 C70 40 110 30 90 62 C120 90 80 92 60 118 C40 92 0 90 30 62 C10 30 50 40 60 4 Z',
  },
]

export function SvgPathsDemo() {
  const [run, setRun] = useState(0)
  const [checked, setChecked] = useState(true)
  const [morph, setMorph] = useState(0)

  return (
    <DemoSection
      id="svg"
      index={9}
      title="SVG pathLength, checkmark and path morph"
      description="pathLength animates from 0 to 1 to draw any path (Motion normalizes its length). The checkmark draws its circle then its tick in sequence, and the blob morphs its d attribute between shapes with a spring."
      source="generated"
      controls={
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRun((r) => r + 1)}
        >
          <RotateCcw /> Redraw
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-dot-grid grid h-56 place-items-center rounded-xl bg-surface-2">
          <svg
            key={run}
            viewBox="0 0 200 120"
            className="h-40 w-full"
            aria-label="Signature drawing"
          >
            <motion.path
              d="M10 80 C 30 20, 50 20, 60 70 S 90 110, 100 60 S 130 10, 140 60 S 170 100, 190 40"
              fill="none"
              stroke="var(--series-1)"
              strokeWidth={4}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
            <motion.circle
              cx={190}
              cy={40}
              r={5}
              fill="var(--series-1)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.9, type: 'spring' }}
            />
          </svg>
        </div>
        <button
          type="button"
          onClick={() => setChecked((c) => !c)}
          className="bg-dot-grid grid h-56 place-items-center rounded-xl bg-surface-2"
          aria-pressed={checked}
          aria-label="Toggle checkmark"
        >
          <svg viewBox="0 0 100 100" className="size-32">
            <AnimatePresence>
              {checked && (
                <>
                  <motion.circle
                    key={`c-${run}`}
                    cx={50}
                    cy={50}
                    r={40}
                    fill="none"
                    stroke="var(--series-3)"
                    strokeWidth={6}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, rotate: -90 }}
                    animate={{ pathLength: 1, rotate: -90 }}
                    exit={{ pathLength: 0, transition: { duration: 0.3 } }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                  <motion.path
                    key={`t-${run}`}
                    d="M30 52 L45 66 L72 36"
                    fill="none"
                    stroke="var(--series-3)"
                    strokeWidth={7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    exit={{ pathLength: 0, transition: { duration: 0.15 } }}
                    transition={{
                      delay: 0.5,
                      type: 'spring',
                      stiffness: 200,
                      damping: 20,
                    }}
                  />
                </>
              )}
            </AnimatePresence>
          </svg>
          <span className="sr-only">{checked ? 'Checked' : 'Unchecked'}</span>
        </button>
        <div className="bg-dot-grid flex h-56 flex-col items-center justify-center gap-3 rounded-xl bg-surface-2">
          <svg
            viewBox="0 0 120 120"
            className="size-32"
            aria-label={`Shape: ${MORPHS[morph].name}`}
          >
            <motion.path
              fill="var(--series-5)"
              initial={false}
              animate={{ d: MORPHS[morph].d }}
              transition={{ type: 'spring', stiffness: 180, damping: 16 }}
            />
          </svg>
          <div className="flex gap-1">
            {MORPHS.map((m, i) => (
              <button
                key={m.name}
                type="button"
                onClick={() => setMorph(i)}
                className={`rounded-md px-2 py-1 text-xs ${i === morph ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </DemoSection>
  )
}
