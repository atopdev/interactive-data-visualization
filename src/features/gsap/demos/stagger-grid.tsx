import { useRef, useState } from 'react'
import { SliderControl } from '@/components/page/control'
import { DemoSection } from '@/components/page/demo-section'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { prefersReducedMotion } from '@/hooks/use-reduced-motion'
import { gsap, useGSAP } from '../gsap'

const COLS = 17
const ROWS = 9
const EASES = [
  'power2.inOut',
  'back.out(3)',
  'elastic.out(1, 0.4)',
  'expo.inOut',
  'bounce.out',
] as const
type Axis = 'both' | 'x' | 'y'

export function StaggerGridDemo() {
  const scope = useRef<HTMLDivElement>(null)
  const [ease, setEase] = useState<(typeof EASES)[number]>('power2.inOut')
  const [amount, setAmount] = useState(1.2)
  const [axis, setAxis] = useState<Axis>('both')
  const [origin, setOrigin] = useState<number | null>(null)

  const { contextSafe } = useGSAP({ scope })

  const wave = contextSafe((index: number) => {
    setOrigin(index)
    // Reduced motion: mark the origin cell only, no ripple.
    if (prefersReducedMotion()) return
    const cells = gsap.utils.toArray<HTMLElement>('[data-cell]')
    gsap.killTweensOf(cells)
    gsap
      .timeline()
      .to(cells, {
        scale: 0.15,
        y: 30,
        rotate: 45,
        opacity: 0.4,
        duration: 0.45,
        ease,
        stagger: {
          grid: [ROWS, COLS],
          from: index,
          amount,
          axis: axis === 'both' ? undefined : axis,
        },
      })
      .to(
        cells,
        {
          scale: 1,
          y: 0,
          rotate: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          stagger: {
            grid: [ROWS, COLS],
            from: index,
            amount,
            axis: axis === 'both' ? undefined : axis,
          },
        },
        0.35,
      )
  })

  return (
    <DemoSection
      id="stagger-grid"
      index={7}
      title="Stagger from the clicked cell"
      description="A single tween targets all 153 cells. The grid-aware stagger computes each cell's delay from its distance to the one you clicked (optionally along one axis only), producing a ripple."
      source="generated"
      controls={
        <>
          <Select
            value={ease}
            onValueChange={(v) => setEase(v as (typeof EASES)[number])}
          >
            <SelectTrigger size="sm" className="w-44" aria-label="Ease">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EASES.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={axis}
            onValueChange={(v) => v && setAxis(v as Axis)}
            aria-label="Stagger axis"
          >
            <ToggleGroupItem value="both">Radial</ToggleGroupItem>
            <ToggleGroupItem value="x">X</ToggleGroupItem>
            <ToggleGroupItem value="y">Y</ToggleGroupItem>
          </ToggleGroup>
          <SliderControl
            label="Total stagger"
            value={amount}
            min={0.3}
            max={3}
            step={0.1}
            onChange={setAmount}
            format={(v) => `${v.toFixed(1)}s`}
          />
        </>
      }
    >
      <div ref={scope} className="rounded-xl bg-surface-2 p-3 sm:p-5">
        <div
          className="grid gap-1 sm:gap-1.5"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: COLS * ROWS }, (_, i) => {
            const col = i % COLS
            const row = Math.floor(i / COLS)
            const hue = (col / COLS) * 0.6 + (row / ROWS) * 0.4
            return (
              <button
                key={i}
                type="button"
                data-cell
                aria-label={`Start wave from row ${row + 1}, column ${col + 1}`}
                onClick={() => wave(i)}
                className="aspect-square rounded-[25%] outline-offset-2 focus-visible:outline-2"
                style={{
                  background: `color-mix(in oklab, var(--page-accent) ${Math.round(100 - hue * 70)}%, var(--series-7))`,
                  boxShadow:
                    origin === i ? '0 0 0 2px var(--foreground)' : undefined,
                }}
              />
            )
          })}
        </div>
      </div>
    </DemoSection>
  )
}
