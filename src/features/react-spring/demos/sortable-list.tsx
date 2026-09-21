import { animated, useSprings } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { GripVertical } from 'lucide-react'
import { useRef, useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { fakeWith } from '@/lib/fake'

const ROW = 60
const TRACKS = fakeWith('spring-sortable', (f) =>
  Array.from({ length: 6 }, () => ({
    title: f.music.songName(),
    artist: f.music.artist(),
    genre: f.music.genre(),
  })),
)

const INITIAL_ORDER = TRACKS.map((_, i) => i)

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function move<T>(arr: T[], from: number, to: number): T[] {
  const copy = [...arr]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

/** Spring targets for every row given the current order (and an active drag). */
const layout =
  (order: number[], active = false, original = 0, curIndex = 0, y = 0) =>
  (index: number) =>
    active && index === original
      ? {
          y: curIndex * ROW + y,
          scale: 1.04,
          zIndex: 1,
          shadow: 18,
          immediate: (k: string) => k === 'y' || k === 'zIndex',
        }
      : {
          y: order.indexOf(index) * ROW,
          scale: 1,
          zIndex: 0,
          shadow: 1,
          immediate: false,
        }

export function SortableListDemo() {
  const reduced = usePrefersReducedMotion()
  const order = useRef(INITIAL_ORDER)
  const [ranking, setRanking] = useState(INITIAL_ORDER)
  const [springs, api] = useSprings(TRACKS.length, layout(INITIAL_ORDER))

  const bind = useDrag(
    ({ args: [originalIndex], active, movement: [, my] }) => {
      const index = originalIndex as number
      const curIndex = order.current.indexOf(index)
      const curRow = clamp(
        Math.round((curIndex * ROW + my) / ROW),
        0,
        TRACKS.length - 1,
      )
      const newOrder = move(order.current, curIndex, curRow)
      api.start((i) => ({
        ...layout(newOrder, active, index, curIndex, my)(i),
        ...(reduced && { immediate: true }),
      }))
      if (!active) {
        order.current = newOrder
        setRanking(newOrder)
      }
    },
  )

  return (
    <DemoSection
      id="sortable"
      index={5}
      title="Draggable sortable list"
      description="useSprings drives one spring per row and @use-gesture's useDrag reports the pointer movement. The dragged row follows the pointer immediately while every other row springs into its new slot as the computed order changes."
      source="generated"
      sourceLabel="Faker songs"
    >
      <div className="mx-auto max-w-xl rounded-xl bg-surface-2 p-3">
        <div className="relative" style={{ height: TRACKS.length * ROW }}>
          {springs.map(({ zIndex, shadow, y, scale }, i) => (
            <animated.div
              key={i}
              {...bind(i)}
              className="absolute inset-x-0 flex h-[52px] cursor-grab touch-none items-center gap-3 rounded-lg border bg-card px-3 select-none active:cursor-grabbing"
              style={{
                zIndex,
                y,
                scale,
                boxShadow: shadow.to(
                  (s) => `rgba(0, 0, 0, 0.18) 0px ${s}px ${2 * s}px 0px`,
                ),
              }}
            >
              <GripVertical className="size-4 text-muted-foreground" />
              <span className="w-5 font-mono text-xs text-muted-foreground tabular-nums">
                {ranking.indexOf(i) + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {TRACKS[i].title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {TRACKS[i].artist}
                </p>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
                {TRACKS[i].genre}
              </span>
            </animated.div>
          ))}
        </div>
      </div>
    </DemoSection>
  )
}
