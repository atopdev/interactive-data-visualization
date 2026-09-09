import { Cpu, Pause } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useWebGLSlot } from '@/lib/webgl-slot'

/**
 * Renders its WebGL child only while it owns the page's single WebGL slot;
 * otherwise shows a lightweight poster. Unmounting the child disposes its
 * context, so at most one context is ever alive.
 */
export function WebGLStage({
  id,
  children,
  className,
  priority,
  poster,
}: {
  id: string
  children: ReactNode
  className?: string
  priority?: number
  poster?: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const active = useWebGLSlot(id, ref, { priority })
  return (
    <div ref={ref} className={cn('relative size-full', className)}>
      {active ? (
        children
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          {poster}
          <p className="relative flex items-center gap-1.5 rounded-full border bg-card/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Pause className="size-3" /> WebGL paused: another demo holds the context
          </p>
        </div>
      )}
      {active && (
        <span className="pointer-events-none absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur">
          <Cpu className="size-3" /> WebGL active
        </span>
      )}
    </div>
  )
}
