import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { AlertTriangle, Compass, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/** Root pending state: an animated skeleton of a demo page. */
export function RoutePending() {
  return (
    <div
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-12 w-3/4 max-w-xl" />
      <Skeleton className="mt-3 h-5 w-1/2 max-w-md" />
      <div className="mt-12 grid gap-6 lg:grid-cols-[14rem_1fr]">
        <div className="hidden flex-col gap-3 lg:flex">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton
              key={i}
              className="h-4"
              style={{ width: `${60 + ((i * 17) % 35)}%` }}
            />
          ))}
        </div>
        <div className="flex flex-col gap-6">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="rounded-2xl border p-6">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="mt-2 h-4 w-2/3" />
              <Skeleton className="mt-6 h-72 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-lg place-items-center px-4 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle />
        </span>
        <h1 className="mt-4 text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'An unexpected error occurred.'}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button
            onClick={() => {
              reset()
              void router.invalidate()
            }}
          >
            <RotateCcw /> Try again
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function RouteNotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-lg place-items-center px-4 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-muted">
          <Compass />
        </span>
        <p className="mt-4 font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mt-1 text-2xl font-semibold">This page wandered off</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The route you asked for does not exist. Try one of the six demo pages instead.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/">Back to the overview</Link>
        </Button>
      </div>
    </div>
  )
}
