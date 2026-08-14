import { MapPin, RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { SmartImage } from '@/components/page/smart-image'
import { Button } from '@/components/ui/button'
import { fakeProfiles } from '@/lib/fake'
import { picsum } from '@/lib/picsum'
import { Draggable, gsap, InertiaPlugin, useGSAP } from '../gsap'

const PROFILES = fakeProfiles('gsap-deck', 7)

export function CardDeckDemo() {
  const scope = useRef<HTMLDivElement>(null)
  // Order of profile indices, last element is the top card.
  const [order, setOrder] = useState(() => PROFILES.map((_, i) => i))
  const [thrown, setThrown] = useState(0)

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-card]')
      const top = cards[cards.length - 1]
      if (!top) return
      // Fan out the stack beneath the top card.
      cards.forEach((card, i) => {
        const depth = cards.length - 1 - i
        gsap.to(card, {
          x: 0,
          y: depth * 8,
          scale: 1 - depth * 0.04,
          rotation: depth === 0 ? 0 : (depth % 2 ? -1 : 1) * depth * 1.5,
          opacity: depth > 4 ? 0 : 1,
          duration: 0.45,
          ease: 'power3.out',
        })
      })

      const [drag] = Draggable.create(top, {
        type: 'x,y',
        inertia: true,
        edgeResistance: 0.65,
        onDrag() {
          gsap.set(top, { rotation: this.x * 0.06 })
        },
        onDragEnd() {
          const vx = InertiaPlugin.getVelocity(top, 'x')
          const shouldThrow = Math.abs(this.x) > 140 || Math.abs(vx) > 900
          if (!shouldThrow) {
            gsap.to(top, {
              x: 0,
              y: 0,
              rotation: 0,
              duration: 0.6,
              ease: 'elastic.out(1, 0.6)',
            })
            return
          }
          const dir = Math.sign(this.x || vx) || 1
          this.disable()
          gsap.to(top, {
            x: dir * (window.innerWidth * 0.6 + 200),
            y: this.y + InertiaPlugin.getVelocity(top, 'y') * 0.25,
            rotation: dir * 35,
            opacity: 0,
            duration: 0.55,
            ease: 'power2.in',
            onComplete: () => {
              // Move the thrown card to the bottom of the deck.
              setOrder((prev) => [prev[prev.length - 1], ...prev.slice(0, -1)])
              setThrown((n) => n + 1)
            },
          })
        },
      })
      return () => drag.kill()
    },
    { scope, dependencies: [order], revertOnUpdate: true },
  )

  return (
    <DemoSection
      id="card-deck"
      index={6}
      title="Draggable + Inertia card deck"
      description="Draggable makes the top card grabbable; InertiaPlugin tracks its velocity. A slow drag snaps back with an elastic ease, while a flick past the threshold throws the card off-screen with the momentum you gave it before it rejoins the bottom of the deck."
      source="generated"
      sourceLabel="Faker profiles + picsum avatars"
      controls={
        <>
          <span className="text-xs text-muted-foreground tabular-nums">
            Thrown: {thrown}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOrder(PROFILES.map((_, i) => i))
              setThrown(0)
            }}
          >
            <RotateCcw /> Reset deck
          </Button>
        </>
      }
    >
      <div
        ref={scope}
        className="bg-dot-grid relative grid h-[26rem] place-items-center overflow-hidden rounded-xl bg-surface-2"
      >
        {order.map((pi) => {
          const p = PROFILES[pi]
          return (
            <article
              key={p.id}
              data-card
              className="absolute w-64 cursor-grab touch-none rounded-2xl border bg-card p-4 shadow-xl select-none active:cursor-grabbing sm:w-72"
            >
              <SmartImage
                src={picsum({ seed: p.avatarSeed, w: 480, h: 360 })}
                alt={`Portrait for ${p.name}`}
                width={480}
                height={360}
                className="rounded-xl"
                draggable={false}
              />
              <h3 className="mt-3 text-lg font-semibold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">
                {p.jobTitle} · {p.company}
              </p>
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" /> {p.city}
              </p>
            </article>
          )
        })}
        <p className="pointer-events-none absolute bottom-3 text-xs text-muted-foreground">
          Drag and flick the top card
        </p>
      </div>
    </DemoSection>
  )
}
