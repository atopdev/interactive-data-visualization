import { animated, to, useSprings } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { Heart, RotateCcw, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { SmartImage } from '@/components/page/smart-image'
import { Button } from '@/components/ui/button'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { fakeProfiles, seededRandom } from '@/lib/fake'
import { picsum } from '@/lib/picsum'

const PEOPLE = fakeProfiles('spring-swipe', 6)
const rand = seededRandom('spring-swipe-rot')
const ROTATIONS = PEOPLE.map(() => -8 + rand() * 16)

const resting = (i: number) => ({
  x: 0,
  y: i * -4,
  scale: 1,
  rot: ROTATIONS[i],
  delay: i * 80,
})
const offscreen = () => ({ x: 0, rot: 0, scale: 1.4, y: -1000 })

export function SwipeDeckDemo() {
  const reduced = usePrefersReducedMotion()
  const gone = useRef(new Set<number>())
  const [decisions, setDecisions] = useState<{ name: string; liked: boolean }[]>([])
  const [springs, api] = useSprings(PEOPLE.length, (i) => ({
    ...resting(i),
    from: offscreen(),
  }))

  const bind = useDrag(
    ({ args: [index], active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
      const i = index as number
      // A quick flick (velocity) or a long drag throws the card.
      const trigger = vx > 0.2 || Math.abs(mx) > 160
      if (!active && trigger) {
        gone.current.add(i)
        setDecisions((d) =>
          [{ name: PEOPLE[i].firstName, liked: xDir > 0 }, ...d].slice(0, 4),
        )
      }
      api.start((j) => {
        if (j !== i) return
        const isGone = gone.current.has(i)
        // Flying cards keep the gesture's velocity so the throw feels physical.
        const x = isGone ? (200 + window.innerWidth) * (xDir || 1) : active ? mx : 0
        const rot = mx / 100 + (isGone ? (xDir || 1) * 10 * Math.max(vx, 1) : 0)
        return {
          x,
          rot,
          scale: active ? 1.06 : 1,
          delay: undefined,
          immediate: reduced,
          config: { friction: 50, tension: active ? 800 : isGone ? 200 : 500 },
        }
      })
      if (!active && gone.current.size === PEOPLE.length) {
        window.setTimeout(() => {
          gone.current.clear()
          api.start((j) => resting(j))
        }, 700)
      }
    },
  )

  return (
    <DemoSection
      id="swipe"
      index={6}
      title="Swipeable card deck"
      description="Drag a card left or right. useDrag hands over the pointer's velocity and direction: flick it (or drag far enough) and the spring launches it off-screen with that velocity factored into the rotation; release early and it springs back. The deck reshuffles when empty."
      source="generated"
      sourceLabel="picsum.photos + Faker"
      controls={
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            gone.current.clear()
            setDecisions([])
            api.start((j) => resting(j))
          }}
        >
          <RotateCcw /> Reset
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-[1fr_14rem]">
        <div className="bg-dot-grid relative grid h-[28rem] place-items-center overflow-hidden rounded-xl bg-surface-2">
          {springs.map(({ x, y, rot, scale }, i) => (
            <animated.div key={PEOPLE[i].id} className="absolute" style={{ x, y }}>
              <animated.article
                {...bind(i)}
                className="w-64 cursor-grab touch-none overflow-hidden rounded-2xl border bg-card shadow-xl select-none sm:w-72"
                style={{
                  transform: to(
                    [rot, scale],
                    (r, s) =>
                      `perspective(1500px) rotateX(20deg) rotateY(${r / 10}deg) rotateZ(${r}deg) scale(${s})`,
                  ),
                }}
              >
                <SmartImage
                  src={picsum({ seed: PEOPLE[i].avatarSeed, w: 560, h: 640 })}
                  alt={`Photo for ${PEOPLE[i].name}`}
                  width={560}
                  height={640}
                  draggable={false}
                  className="h-72"
                  style={{ aspectRatio: 'auto' }}
                />
                <div className="p-4">
                  <p className="text-lg font-semibold">
                    {PEOPLE[i].firstName},{' '}
                    <span className="font-normal text-muted-foreground">
                      {PEOPLE[i].city}
                    </span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {PEOPLE[i].bio}
                  </p>
                </div>
              </animated.article>
            </animated.div>
          ))}
        </div>
        <div className="flex flex-col gap-2 rounded-xl bg-surface-2 p-4">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Decisions
          </p>
          {decisions.length === 0 && (
            <p className="text-sm text-muted-foreground">Swipe a card</p>
          )}
          {decisions.map((d, i) => (
            <p key={`${d.name}-${i}`} className="flex items-center gap-2 text-sm">
              {d.liked ? (
                <Heart className="size-4 text-emerald-500" />
              ) : (
                <X className="size-4 text-red-500" />
              )}
              {d.name}
            </p>
          ))}
        </div>
      </div>
    </DemoSection>
  )
}
