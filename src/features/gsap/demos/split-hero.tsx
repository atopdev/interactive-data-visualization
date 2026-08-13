import { RotateCcw, Shuffle } from 'lucide-react'
import { useRef, useState } from 'react'
import { SliderControl } from '@/components/page/control'
import { DemoSection } from '@/components/page/demo-section'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { fakeWith } from '@/lib/fake'
import { usePageRevealed } from '@/lib/transition-store'
import { gsap, MOTION_OK, SplitText, useGSAP } from '../gsap'

export type SplitMode = 'chars' | 'words' | 'lines'

const HEADLINES = fakeWith('gsap-split-headlines', (f) =>
  Array.from({ length: 8 }, () => {
    const phrase = f.company.catchPhrase()
    return phrase.charAt(0).toUpperCase() + phrase.slice(1)
  }),
)

export function SplitHeroDemo({
  mode,
  onModeChange,
}: {
  mode: SplitMode
  onModeChange: (mode: SplitMode) => void
}) {
  const scope = useRef<HTMLDivElement>(null)
  const [stagger, setStagger] = useState(0.03)
  const [index, setIndex] = useState(0)
  const [replay, setReplay] = useState(0)
  const revealed = usePageRevealed()

  useGSAP(
    () => {
      if (!revealed) return
      const el = scope.current?.querySelector<HTMLElement>('[data-headline]')
      if (!el) return
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        // autoSplit re-splits on resize/font load so line breaks stay correct.
        SplitText.create(el, {
          type: 'lines,words,chars',
          mask: mode === 'chars' ? 'words' : 'lines',
          autoSplit: true,
          onSplit(self) {
            if (mode === 'chars') {
              return gsap.from(self.chars, {
                yPercent: 120,
                rotate: 12,
                opacity: 0,
                duration: 0.9,
                ease: 'expo.out',
                stagger,
              })
            }
            if (mode === 'words') {
              return gsap.from(self.words, {
                yPercent: 110,
                duration: 0.8,
                ease: 'power4.out',
                stagger: stagger * 3,
              })
            }
            return gsap.from(self.lines, {
              yPercent: 100,
              opacity: 0,
              filter: 'blur(8px)',
              duration: 1,
              ease: 'power3.out',
              stagger: stagger * 6,
            })
          },
        })
      })
      return () => mm.revert()
    },
    {
      scope,
      dependencies: [mode, stagger, index, replay, revealed],
      revertOnUpdate: true,
    },
  )

  return (
    <DemoSection
      id="split-text"
      index={1}
      title="SplitText hero reveal"
      description="SplitText breaks the headline into lines, words and characters with overflow masks, then a staggered tween reveals each piece. It re-splits automatically on resize so line breaks are always correct."
      source="generated"
      sourceLabel="Faker catch phrases"
      reveal
      controls={
        <>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={mode}
            onValueChange={(v) => v && onModeChange(v as SplitMode)}
            aria-label="Split mode"
          >
            <ToggleGroupItem value="chars">Chars</ToggleGroupItem>
            <ToggleGroupItem value="words">Words</ToggleGroupItem>
            <ToggleGroupItem value="lines">Lines</ToggleGroupItem>
          </ToggleGroup>
          <SliderControl
            label="Stagger"
            value={stagger}
            min={0.005}
            max={0.08}
            step={0.005}
            onChange={setStagger}
            format={(v) => `${v.toFixed(3)}s`}
          />
          <Button variant="outline" size="sm" onClick={() => setReplay((r) => r + 1)}>
            <RotateCcw /> Replay
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIndex((i) => (i + 1) % HEADLINES.length)}
          >
            <Shuffle /> New headline
          </Button>
        </>
      }
    >
      <div
        ref={scope}
        className="bg-dot-grid relative grid min-h-72 place-items-center overflow-hidden rounded-xl bg-surface-2 px-6 py-12"
      >
        <h3
          key={`${index}-${mode}`}
          data-headline
          className="max-w-3xl text-center text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl"
        >
          {HEADLINES[index]}
        </h3>
      </div>
    </DemoSection>
  )
}
