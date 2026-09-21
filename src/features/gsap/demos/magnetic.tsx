import { ArrowUpRight, Heart, Send, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { SliderControl } from '@/components/page/control'
import { DemoSection } from '@/components/page/demo-section'
import { gsap, MOTION_OK, useGSAP } from '../gsap'

const BUTTONS = [
  { label: 'Get started', icon: ArrowUpRight },
  { label: 'Send', icon: Send },
  { label: 'Like', icon: Heart },
  { label: 'Magic', icon: Sparkles },
]

export function MagneticDemo() {
  const scope = useRef<HTMLDivElement>(null)
  const [strength, setStrength] = useState(0.45)

  useGSAP(
    () => {
      const area = scope.current
      if (!area) return
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const follower = area.querySelector<HTMLElement>('[data-follower]')
        const buttons = gsap.utils.toArray<HTMLElement>('[data-magnet]')
        if (!follower) return
        // quickTo reuses a single tween per property: ideal for pointermove.
        const fx = gsap.quickTo(follower, 'x', {
          duration: 0.45,
          ease: 'power3',
        })
        const fy = gsap.quickTo(follower, 'y', {
          duration: 0.45,
          ease: 'power3',
        })
        const magnets = buttons.map((btn) => ({
          btn,
          inner: btn.querySelector<HTMLElement>('[data-magnet-inner]'),
          x: gsap.quickTo(btn, 'x', {
            duration: 0.6,
            ease: 'elastic.out(1, 0.35)',
          }),
          y: gsap.quickTo(btn, 'y', {
            duration: 0.6,
            ease: 'elastic.out(1, 0.35)',
          }),
        }))

        const onMove = (e: PointerEvent) => {
          const box = area.getBoundingClientRect()
          fx(e.clientX - box.left)
          fy(e.clientY - box.top)
          let hovering = false
          for (const m of magnets) {
            const r = m.btn.getBoundingClientRect()
            const cx = r.left + r.width / 2
            const cy = r.top + r.height / 2
            const dx = e.clientX - cx
            const dy = e.clientY - cy
            const near = Math.hypot(dx, dy) < Math.max(r.width, r.height) * 0.95
            m.x(near ? dx * strength : 0)
            m.y(near ? dy * strength : 0)
            if (m.inner)
              gsap.to(m.inner, {
                x: near ? dx * strength * 0.4 : 0,
                y: near ? dy * strength * 0.4 : 0,
                duration: 0.4,
              })
            hovering ||= near
          }
          gsap.to(follower, {
            scale: hovering ? 3.2 : 1,
            opacity: hovering ? 0.25 : 1,
            duration: 0.3,
          })
        }
        const onLeave = () => {
          magnets.forEach((m) => {
            m.x(0)
            m.y(0)
          })
          gsap.to(follower, { scale: 0, duration: 0.3 })
        }
        const onEnter = () => gsap.to(follower, { scale: 1, duration: 0.3 })
        area.addEventListener('pointermove', onMove)
        area.addEventListener('pointerleave', onLeave)
        area.addEventListener('pointerenter', onEnter)
        return () => {
          area.removeEventListener('pointermove', onMove)
          area.removeEventListener('pointerleave', onLeave)
          area.removeEventListener('pointerenter', onEnter)
        }
      })
      return () => mm.revert()
    },
    { scope, dependencies: [strength], revertOnUpdate: true },
  )

  return (
    <DemoSection
      id="magnetic"
      index={8}
      title="Magnetic buttons + cursor follower"
      description="gsap.quickTo creates reusable setter tweens, so every pointermove only updates a target value. Buttons lean towards the pointer with an elastic ease (labels move a little less for depth) and the follower swells when it is over one."
      source="generated"
      controls={
        <SliderControl
          label="Magnet strength"
          value={strength}
          min={0.1}
          max={0.9}
          step={0.05}
          onChange={setStrength}
          format={(v) => v.toFixed(2)}
        />
      }
    >
      <div
        ref={scope}
        className="bg-dot-grid relative flex min-h-72 cursor-none flex-wrap items-center justify-center gap-8 overflow-hidden rounded-xl bg-surface-2 p-10 motion-reduce:cursor-auto"
      >
        <div
          data-follower
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-10 -mt-2.5 -ml-2.5 size-5 scale-0 rounded-full bg-page-accent mix-blend-difference"
        />
        {BUTTONS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            data-magnet
            className="grid size-28 place-items-center rounded-full border bg-card shadow-sm transition-colors hover:border-page-accent sm:size-32"
          >
            <span
              data-magnet-inner
              className="flex flex-col items-center gap-1.5 text-sm font-medium"
            >
              <Icon className="size-5" />
              {label}
            </span>
          </button>
        ))}
      </div>
    </DemoSection>
  )
}
