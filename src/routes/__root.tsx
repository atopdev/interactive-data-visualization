import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { RouteError, RouteNotFound, RoutePending } from '@/components/layout/route-states'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { PageTransition } from '@/components/transition/page-transition'

export interface RouterContext {
  queryClient: QueryClient
}

// Devtools are code-split and never shipped in production builds.
const Devtools = import.meta.env.DEV ? lazy(() => import('@/components/devtools')) : null

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
})

function RootLayout() {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[110] rounded-md bg-background px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <PageTransition />
      <SiteHeader />
      <main id="main" className="min-h-[calc(100svh-3.5rem)]">
        <Outlet />
      </main>
      <SiteFooter />
      {Devtools && (
        <Suspense>
          <Devtools />
        </Suspense>
      )}
    </>
  )
}
