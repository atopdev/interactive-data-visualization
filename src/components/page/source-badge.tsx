import { CloudOff, Radio, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { DataSource } from '@/lib/fetchers'
import { cn } from '@/lib/utils'

export type BadgeState = DataSource | 'loading'

const LABELS: Record<BadgeState, string> = {
  live: 'Live',
  snapshot: 'Offline snapshot',
  generated: 'Generated',
  loading: 'Loading',
}

export function SourceBadge({
  source,
  reason,
  className,
}: {
  source: BadgeState
  reason?: string
  className?: string
}) {
  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-medium',
        source === 'live' &&
          'border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
        source === 'snapshot' &&
          'border-amber-500/50 text-amber-700 dark:text-amber-300',
        source === 'generated' &&
          'border-violet-500/40 text-violet-700 dark:text-violet-300',
        source === 'loading' && 'text-muted-foreground',
        className,
      )}
    >
      {source === 'live' && (
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
      )}
      {source === 'snapshot' && <CloudOff className="size-3" />}
      {source === 'generated' && <Sparkles className="size-3" />}
      {source === 'loading' && <Radio className="size-3 animate-pulse" />}
      {LABELS[source]}
    </Badge>
  )
  if (source !== 'snapshot' || !reason) return badge
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>{badge}</span>
      </TooltipTrigger>
      <TooltipContent>
        Live request {reason}; showing bundled data.
      </TooltipContent>
    </Tooltip>
  )
}
