import { animated, useSpring } from '@react-spring/web'
import { useGesture } from '@use-gesture/react'
import { Maximize, ZoomIn, ZoomOut } from 'lucide-react'
import { useRef, useState } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import { Button } from '@/components/ui/button'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'
import { picsumSet } from '@/lib/picsum'
import { cn } from '@/lib/utils'

const PHOTOS = picsumSet('spring-viewer', 5, 1600, 1100)
const MIN = 1
const MAX = 5

export function ImageViewerDemo() {
  const reduced = usePrefersReducedMotion()
  const frame = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [{ x, y, scale }, api] = useSpring(() => ({ x: 0, y: 0, scale: 1 }))

  // Keep the image edges inside the frame for the current zoom level.
  const bounds = (s: number) => {
    const r = frame.current?.getBoundingClientRect()
    const w = ((r?.width ?? 0) * (s - 1)) / 2
    const h = ((r?.height ?? 0) * (s - 1)) / 2
    return { left: -w, right: w, top: -h, bottom: h }
  }
  const clampXY = (nx: number, ny: number, s: number) => {
    const b = bounds(s)
    return {
      x: Math.min(b.right, Math.max(b.left, nx)),
      y: Math.min(b.bottom, Math.max(b.top, ny)),
    }
  }
  const zoomTo = (s: number) => {
    const next = Math.min(MAX, Math.max(MIN, s))
    api.start({
      scale: next,
      ...clampXY(x.get(), y.get(), next),
      immediate: reduced,
    })
  }

  useGesture(
    {
      onDrag: ({ offset: [dx, dy], pinching, cancel }) => {
        if (pinching) return cancel()
        api.start({ ...clampXY(dx, dy, scale.get()), immediate: reduced })
      },
      onPinch: ({ offset: [s] }) => zoomTo(s),
      onWheel: ({ event, delta: [, dy] }) => {
        event.preventDefault()
        zoomTo(scale.get() * (dy > 0 ? 0.9 : 1.1))
      },
      onDoubleClick: () => zoomTo(scale.get() > 1.5 ? 1 : 2.5),
    },
    {
      target: frame,
      eventOptions: { passive: false },
      drag: {
        from: () => [x.get(), y.get()],
        bounds: () => bounds(scale.get()),
        rubberband: true,
      },
      pinch: {
        from: () => [scale.get(), 0],
        scaleBounds: { min: MIN, max: MAX },
        rubberband: true,
      },
    },
  )

  const photo = PHOTOS[index]

  return (
    <DemoSection
      id="viewer"
      index={9}
      title="Pinch, wheel and drag image viewer"
      description="@use-gesture's useGesture unifies pinch (touch or trackpad), wheel and drag. Zoom is clamped to 1–5×, panning is bounded to the zoomed image's edges with a rubber band, and a double-click toggles zoom, all driven by one spring."
      source="generated"
      sourceLabel="picsum.photos"
      controls={
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => zoomTo(scale.get() * 1.4)}
            aria-label="Zoom in"
          >
            <ZoomIn />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => zoomTo(scale.get() / 1.4)}
            aria-label="Zoom out"
          >
            <ZoomOut />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => api.start({ x: 0, y: 0, scale: 1 })}
          >
            <Maximize /> Reset
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div
          ref={frame}
          className="relative aspect-[16/11] cursor-grab touch-none overflow-hidden rounded-xl bg-black select-none active:cursor-grabbing"
        >
          <animated.img
            key={photo.id}
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="size-full object-cover"
            style={{ x, y, scale }}
          />
          <animated.span className="absolute right-3 bottom-3 rounded-full bg-black/60 px-2.5 py-1 font-mono text-xs text-white">
            {scale.to((s) => `${s.toFixed(1)}×`)}
          </animated.span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PHOTOS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setIndex(i)
                api.start({ x: 0, y: 0, scale: 1, immediate: true })
              }}
              className={cn(
                'h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-transparent opacity-60 transition',
                i === index && 'border-page-accent opacity-100',
              )}
              aria-label={`Show ${p.title}`}
            >
              <img
                src={p.placeholder.replace(/\?blur=\d+/, '')}
                alt=""
                width={80}
                height={56}
                className="size-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>
    </DemoSection>
  )
}
