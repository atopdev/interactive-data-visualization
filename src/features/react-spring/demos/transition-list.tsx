import { animated, useSpring, useTransition } from '@react-spring/web'
import { Plus, Shuffle, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { Button } from '@/components/ui/button'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { fakeWith, seededRandom } from '@/lib/fake'

interface Item {
  id: number
  name: string
  role: string
  color: number
}

const ROW = 64
const POOL: Item[] = fakeWith('spring-transition', (f) =>
  Array.from({ length: 40 }, (_, i) => ({
    id: i,
    name: f.person.fullName(),
    role: f.person.jobTitle(),
    color: (i % 8) + 1,
  })),
)
const rand = seededRandom('spring-transition-shuffle')

export function TransitionListDemo() {
  const reduced = usePrefersReducedMotion()
  const [items, setItems] = useState(() => POOL.slice(0, 4))
  const [next, setNext] = useState(4)

  // Rows are absolutely positioned; `y` follows each item's index, so
  // shuffles glide rows to their new slots instead of re-rendering in place.
  const transitions = useTransition(
    items.map((item, i) => ({ ...item, y: i * ROW })),
    {
      keys: (item) => item.id,
      from: { opacity: 0, scale: 0.9, height: 0 },
      enter: ({ y }) => ({ y, opacity: 1, scale: 1, height: ROW - 8 }),
      update: ({ y }) => ({ y }),
      leave: { opacity: 0, scale: 0.9, height: 0 },
      config: { tension: 320, friction: 28 },
      immediate: reduced,
    },
  )
  // The container animates to the list's total height: an "auto height" spring.
  const container = useSpring({
    height: Math.max(1, items.length) * ROW,
    immediate: reduced,
  })

  const add = () => {
    setItems((prev) => [...prev, POOL[next % POOL.length]].slice(-8))
    setNext((n) => n + 1)
  }
  const shuffle = () =>
    setItems((prev) => {
      const copy = [...prev]
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy
    })

  return (
    <DemoSection
      id="transition"
      index={3}
      title="useTransition list: add, remove, shuffle"
      description="useTransition keys each item so enters, leaves and updates animate independently. Rows are positioned by a spring-driven y, making shuffles glide, while the container height springs to fit the list, the equivalent of animating to height: auto."
      source="generated"
      sourceLabel="Faker people"
      controls={
        <>
          <Button size="sm" onClick={add} disabled={items.length >= 8}>
            <Plus /> Add
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={shuffle}
            disabled={items.length < 2}
          >
            <Shuffle /> Shuffle
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setItems([])}
            disabled={!items.length}
          >
            <Trash2 /> Clear
          </Button>
        </>
      }
    >
      <div className="mx-auto max-w-xl rounded-xl bg-surface-2 p-3">
        <animated.ul className="relative" style={container}>
          {transitions((style, item) => (
            <animated.li
              className="absolute inset-x-0 flex items-center gap-3 overflow-hidden rounded-lg border bg-card px-3"
              style={{
                ...style,
                transform: style.y.to((y) => `translate3d(0, ${y}px, 0)`),
              }}
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
                style={{ background: `var(--series-${item.color})` }}
              >
                {item.name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="truncate text-xs text-muted-foreground">{item.role}</p>
              </div>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted"
                aria-label={`Remove ${item.name}`}
              >
                <X className="size-4" />
              </button>
            </animated.li>
          ))}
          {!items.length && (
            <p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
              Empty list. Add someone.
            </p>
          )}
        </animated.ul>
      </div>
    </DemoSection>
  )
}
