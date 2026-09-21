import { Shuffle } from 'lucide-react'
import { useRef, useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { Button } from '@/components/ui/button'
import { fakeWith } from '@/lib/fake'
import { gsap, MOTION_OK, useGSAP } from '../gsap'

const PHRASES = fakeWith('gsap-scramble', (f) =>
  Array.from({ length: 6 }, () => f.hacker.phrase()),
)
const MENU = fakeWith('gsap-scramble-menu', (f) =>
  Array.from({ length: 5 }, () => f.commerce.department()),
)

export function ScrambleTextDemo() {
  const scope = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from('[data-scramble-headline]', {
          scrambleText: { text: '', chars: '01', speed: 0.4 },
          duration: 1.6,
          scrollTrigger: { trigger: scope.current, start: 'top 80%' },
        })
      })
      return () => mm.revert()
    },
    { scope },
  )

  const scrambleTo = contextSafe((i: number) => {
    gsap.to('[data-scramble-headline]', {
      duration: 1.4,
      scrambleText: {
        text: PHRASES[i],
        chars: 'upperAndLowerCase',
        revealDelay: 0.3,
        speed: 0.5,
        newClass: 'text-page-accent',
      },
    })
  })

  const next = () => {
    const i = (index + 1) % PHRASES.length
    setIndex(i)
    scrambleTo(i)
  }

  const hover = contextSafe((el: HTMLElement, text: string) => {
    gsap.to(el, {
      duration: 0.6,
      scrambleText: { text, chars: '▪▫◆◇', speed: 0.8 },
    })
  })

  return (
    <DemoSection
      id="scramble"
      index={12}
      title="Text scramble"
      description="ScrambleTextPlugin replaces characters with random glyphs before revealing the new string, with a configurable character set, reveal delay and speed. Hover the menu items for a quick glyph shuffle."
      source="generated"
      sourceLabel="Faker hacker phrases"
      controls={
        <Button variant="outline" size="sm" onClick={next}>
          <Shuffle /> Scramble to next
        </Button>
      }
    >
      <div
        ref={scope}
        className="grid gap-6 rounded-xl bg-surface-2 p-6 sm:p-8 md:grid-cols-[1fr_14rem]"
      >
        <p
          data-scramble-headline
          aria-live="polite"
          className="min-h-[6.5rem] font-mono text-2xl leading-snug font-medium sm:text-3xl"
        >
          {PHRASES[0]}
        </p>
        <ul className="flex flex-col gap-1 border-l pl-4">
          {MENU.map((item) => (
            <li key={item}>
              <button
                type="button"
                onPointerEnter={(e) => hover(e.currentTarget, item)}
                onFocus={(e) => hover(e.currentTarget, item)}
                className="w-full py-1 text-left font-mono text-sm tracking-wide uppercase hover:text-page-accent"
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </DemoSection>
  )
}
