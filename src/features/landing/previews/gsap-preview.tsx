import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef } from 'react'

gsap.registerPlugin(useGSAP)

const COLS = 12
const ROWS = 7

/** Mini stagger grid: a wave radiating from a random cell, forever. */
export default function GsapPreview() {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const cells = gsap.utils.toArray<HTMLElement>('[data-cell]')
        const wave = () =>
          gsap
            .timeline({ onComplete: wave })
            .to(cells, {
              scale: 0.25,
              opacity: 0.35,
              duration: 0.45,
              ease: 'power2.inOut',
              stagger: { grid: [ROWS, COLS], from: 'random', amount: 0.9 },
            })
            .to(cells, {
              scale: 1,
              opacity: 1,
              duration: 0.55,
              ease: 'back.out(2)',
              stagger: { grid: [ROWS, COLS], from: 'center', amount: 0.9 },
            })
        wave()
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <div
      ref={ref}
      className="grid size-full place-content-center gap-1.5"
      style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      aria-hidden
    >
      {Array.from({ length: COLS * ROWS }, (_, i) => (
        <span
          key={i}
          data-cell
          className="size-3.5 rounded-[4px] sm:size-4"
          style={{
            background:
              (i + Math.floor(i / COLS)) % 3 === 0
                ? 'var(--accent-gsap)'
                : 'color-mix(in oklab, var(--accent-gsap) 35%, var(--muted))',
          }}
        />
      ))}
    </div>
  )
}
