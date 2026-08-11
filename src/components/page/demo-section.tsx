import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SourceBadge, type BadgeState } from './source-badge'

export interface DemoSectionProps {
  id: string
  /** 1-based index shown as a label. */
  index?: number
  title: string
  description: ReactNode
  source: BadgeState
  sourceReason?: string
  /** Extra label next to the badge, e.g. the API name. */
  sourceLabel?: string
  controls?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  /** Animate this section as part of the page entrance. */
  reveal?: boolean
}

/** A single demo: title, description, provenance badge, controls and the demo itself. */
export function DemoSection({
  id,
  index,
  title,
  description,
  source,
  sourceReason,
  sourceLabel,
  controls,
  children,
  className,
  bodyClassName,
  reveal,
}: DemoSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      data-page-reveal={reveal || undefined}
      data-demo-section
      className={cn(
        'scroll-mt-20 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs',
        className,
      )}
    >
      <header className="flex flex-col gap-3 border-b p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {index !== undefined && (
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {String(index).padStart(2, '0')}
            </span>
          )}
          <SourceBadge source={source} reason={sourceReason} />
          {sourceLabel && (
            <span className="text-xs text-muted-foreground">{sourceLabel}</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <h2
            id={`${id}-title`}
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            {title}
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-pretty text-muted-foreground">
            {description}
          </p>
        </div>
        {controls && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
            {controls}
          </div>
        )}
      </header>
      <div className={cn('relative p-4 sm:p-6', bodyClassName)}>{children}</div>
    </section>
  )
}
