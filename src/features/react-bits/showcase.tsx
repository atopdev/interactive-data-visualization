import { Check, Copy, Cpu, Pause } from 'lucide-react'
import { useId, useRef, useState, type ReactNode } from 'react'
import { DemoSection } from '@/components/page/demo-section'
import type { BadgeState } from '@/components/page/source-badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useWebGLSlot } from '@/lib/webgl-slot'

/** Code block with a copy-to-clipboard button. */
export function CodeSnippet({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked (insecure context/permissions); nothing to do.
    }
  }
  return (
    <div className={cn('overflow-hidden rounded-xl border bg-surface-2', className)}>
      <div className="flex items-center justify-between border-b px-4 py-1.5">
        <span className="font-mono text-[11px] text-muted-foreground">Usage (TSX)</span>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => void copy()}
          aria-label="Copy usage"
        >
          {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy usage'}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-muted-foreground">
        <code>{code}</code>
      </pre>
    </div>
  )
}

/** Native color picker styled as a control. */
export function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (hex: string) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-7 cursor-pointer rounded-md border bg-transparent p-0.5"
      />
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
    </div>
  )
}

interface ShowcaseProps {
  id: string
  title: string
  description: ReactNode
  category: string
  controls?: ReactNode
  code: string
  children: ReactNode
  className?: string
  previewClassName?: string
  source?: BadgeState
  sourceReason?: string
}

/** A React Bits component: live preview, prop controls and a usage snippet. */
export function Showcase({
  id,
  title,
  description,
  category,
  controls,
  code,
  children,
  className,
  previewClassName,
  source = 'generated',
  sourceReason,
}: ShowcaseProps) {
  return (
    <DemoSection
      id={id}
      title={title}
      description={description}
      source={source}
      sourceReason={sourceReason}
      sourceLabel={category}
      controls={controls}
      className={className}
    >
      <div className="flex flex-col gap-4">
        <div
          className={cn(
            'bg-dot-grid relative grid min-h-64 place-items-center overflow-hidden rounded-xl bg-surface-2 p-6',
            previewClassName,
          )}
        >
          {children}
        </div>
        <CodeSnippet code={code} />
      </div>
    </DemoSection>
  )
}

/** Section heading for a React Bits category (also a TOC anchor). */
export function CategoryHeader({
  id,
  title,
  description,
}: {
  id: string
  title: string
  description: string
}) {
  return (
    <div id={id} className="scroll-mt-20 border-b pt-6 pb-3">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

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
