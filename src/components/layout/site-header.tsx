import { Link, useRouterState } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { PAGE_GROUPS, PAGES, pageForPath } from '@/lib/pages'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'

function AccentDot({
  accentVar,
  className,
}: {
  accentVar: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-2.5 shrink-0 rounded-full', className)}
      style={{ background: `var(${accentVar})` }}
    />
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const activeGroup = pageForPath(pathname)?.group

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center">
          <img
            src="/brand/logo-light.svg"
            alt="Interactive Data Visualization"
            width={118}
            height={40}
            className="h-10 w-auto dark:hidden"
          />
          <img
            src="/brand/logo-dark.svg"
            alt="Interactive Data Visualization"
            width={118}
            height={40}
            className="hidden h-10 w-auto dark:block"
          />
        </Link>

        <NavigationMenu viewport={false} className="ml-2 hidden md:flex">
          <NavigationMenuList>
            {PAGE_GROUPS.map((group) => (
              <NavigationMenuItem key={group}>
                <NavigationMenuTrigger
                  data-active={activeGroup === group || undefined}
                  className="relative data-active:after:absolute data-active:after:inset-x-3 data-active:after:-bottom-[11px] data-active:after:h-0.5 data-active:after:rounded-full data-active:after:bg-page-accent"
                >
                  {group}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[26rem] gap-1 p-1 lg:w-[30rem] lg:grid-cols-2">
                    {PAGES.filter((p) => p.group === group).map((page) => (
                      <li key={page.id}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={page.to}
                            className="flex flex-col items-start gap-1 rounded-md p-3"
                            activeProps={{ className: 'bg-accent' }}
                          >
                            <span className="flex items-center gap-2 text-sm font-medium">
                              <AccentDot accentVar={page.accentVar} />
                              {page.title}
                            </span>
                            <span className="text-xs leading-snug text-muted-foreground">
                              {page.tagline}
                            </span>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Interactive Data Visualization</SheetTitle>
                <SheetDescription>Six libraries, one gallery.</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-6 px-4" aria-label="Mobile">
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium"
                  activeOptions={{ exact: true }}
                  activeProps={{ className: 'text-page-accent' }}
                >
                  Overview
                </Link>
                {PAGE_GROUPS.map((group) => (
                  <div key={group} className="flex flex-col gap-1">
                    <p className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      {group}
                    </p>
                    {PAGES.filter((p) => p.group === group).map((page) => (
                      <Link
                        key={page.id}
                        to={page.to}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent"
                        activeProps={{ className: 'bg-accent font-medium' }}
                      >
                        <AccentDot accentVar={page.accentVar} />
                        {page.title}
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
