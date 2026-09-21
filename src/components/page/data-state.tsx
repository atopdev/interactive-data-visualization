import type { UseQueryResult } from '@tanstack/react-query'
import { AlertTriangle, Inbox } from 'lucide-react'
import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Sourced } from '@/lib/fetchers'
import { cn } from '@/lib/utils'

interface DataStateProps<T> {
  query: UseQueryResult<Sourced<T>>
  /** Treat the resolved data as empty (e.g. no rows after filtering). */
  isEmpty?: (data: T) => boolean
  emptyMessage?: string
  className?: string
  children: (data: T) => ReactNode
}

/**
 * The three states every data demo handles: loading (skeleton), resolved
 * (live or snapshot; the badge shows which) and empty. A hard error only
 * occurs if even the bundled snapshot fails to load.
 */
export function DataState<T>({
  query,
  isEmpty,
  emptyMessage = 'No data for this selection.',
  className,
  children,
}: DataStateProps<T>) {
  if (query.isPending) {
    return (
      <div
        className={cn('relative h-80', className)}
        role="status"
        aria-label="Loading data"
      >
        <Skeleton className="absolute inset-0 rounded-xl" />
      </div>
    )
  }
  if (query.isError) {
    return (
      <div
        className={cn(
          'grid h-80 place-items-center rounded-xl border border-dashed text-sm text-muted-foreground',
          className,
        )}
      >
        <p className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-destructive" /> Data
          unavailable: {query.error.message}
        </p>
      </div>
    )
  }
  if (isEmpty?.(query.data.data)) {
    return (
      <div
        className={cn(
          'grid h-80 place-items-center rounded-xl border border-dashed text-sm text-muted-foreground',
          className,
        )}
      >
        <p className="flex items-center gap-2">
          <Inbox className="size-4" /> {emptyMessage}
        </p>
      </div>
    )
  }
  return <>{children(query.data.data)}</>
}
