import { useGSAP } from '@gsap/react'
import { useBlocker, useRouter } from '@tanstack/react-router'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { useCallback, useRef } from 'react'
import { prefersReducedMotion } from '@/hooks/use-reduced-motion'
import { pageForPath } from '@/lib/pages'
import { getTransitionPhase, setTransitionPhase } from '@/lib/transition-store'

gsap.registerPlugin(useGSAP, SplitText)

const LAYERS = 3
const COLUMNS = 5

/** Colors for each overlay layer, back to front; the front layer is the page background. */
function layerColors(pathname: string): string[] {
  const page = pageForPath(pathname)
  const accent = page ? `var(${page.accentVar})` : 'var(--foreground)'
  return [`color-mix(in oklab, ${accent} 55%, black)`, accent, 'var(--background)']
}

function applyPageAttr(pathname: string) {
  const page = pageForPath(pathname)
  const root = document.documentElement
  if (page) root.dataset.page = page.id
  else delete root.dataset.page
}

/**
 * Full-screen GSAP wipe between routes.
 *
 * - Cover: an async `useBlocker` hook plays the cover timeline and only then
 *   lets the navigation proceed, so it works for links, programmatic
 *   navigation and browser back/forward alike.
 * - Reveal: triggered from `router.subscribe('onResolved')`, i.e. after
 *   loaders and lazy route chunks have resolved underneath the overlay.
 * - Reduced motion: a plain crossfade instead of the staggered wipe.
 */
export function PageTransition() {
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLParagraphElement>(null)
  const coverRef = useRef<Promise<void> | null>(null)

  const layers = () =>
    gsap.utils
      .toArray<HTMLElement>('[data-layer]', rootRef.current)
      .map((layer) => gsap.utils.toArray<HTMLElement>('[data-col]', layer))

  const cover = useCallback((toPath: string): Promise<void> => {
    const phase = getTransitionPhase()
    if (phase === 'covered') return Promise.resolve()
    if (phase === 'covering' && coverRef.current) return coverRef.current

    setTransitionPhase('covering')
    const root = rootRef.current
    if (!root) return Promise.resolve()
    const colors = layerColors(toPath)
    const page = pageForPath(toPath)
    if (labelRef.current) labelRef.current.textContent = page?.title ?? 'Home'

    coverRef.current = new Promise<void>((resolve) => {
      const done = () => {
        applyPageAttr(toPath)
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        setTransitionPhase('covered')
        coverRef.current = null
        resolve()
      }
      gsap.set(root, { pointerEvents: 'auto', autoAlpha: 1 })

      if (prefersReducedMotion()) {
        const front = layers()[LAYERS - 1]
        gsap.set(layers().flat(), { yPercent: 100 })
        gsap.set(front, { yPercent: 0 })
        gsap.fromTo(
          root,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.2, onComplete: done },
        )
        return
      }

      const tl = gsap.timeline({ onComplete: done })
      layers().forEach((cols, li) => {
        cols.forEach((col) => (col.style.background = colors[li]))
        tl.fromTo(
          cols,
          { yPercent: 100 },
          { yPercent: 0, duration: 0.55, ease: 'power3.inOut', stagger: 0.05 },
          li * 0.09,
        )
      })
      tl.fromTo(
        labelRef.current,
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' },
        '-=0.2',
      )
    })
    return coverRef.current
  }, [])

  const reveal = useCallback(() => {
    const root = rootRef.current
    // Only lift a covered overlay; the initial rAF and the first onResolved can both fire.
    if (!root || getTransitionPhase() !== 'covered') return
    setTransitionPhase('revealing')
    applyPageAttr(router.state.location.pathname)

    const main = document.querySelector('main')
    const heading = main?.querySelector<HTMLElement>('[data-page-heading]')
    const blocks = main ? gsap.utils.toArray<HTMLElement>('[data-page-reveal]', main) : []

    const finish = () => {
      gsap.set(root, { pointerEvents: 'none', autoAlpha: 0 })
      setTransitionPhase('idle')
      // New page content changes layout: recompute every ScrollTrigger. Pages
      // that use ScrollTrigger already loaded it, so this import is a cache hit;
      // keeping it dynamic keeps the plugin out of the entry chunk. Triggers of
      // the previous page were killed when its useGSAP contexts reverted.
      requestAnimationFrame(() => {
        void import('gsap/ScrollTrigger').then(({ ScrollTrigger }) =>
          ScrollTrigger.refresh(),
        )
      })
    }

    if (prefersReducedMotion()) {
      gsap.to(root, { autoAlpha: 0, duration: 0.25, onComplete: finish })
      return
    }

    const tl = gsap.timeline({ onComplete: finish })
    tl.to(labelRef.current, { autoAlpha: 0, y: -12, duration: 0.2, ease: 'power2.in' })
    const all = layers()
    ;[...all].reverse().forEach((cols, i) => {
      tl.to(
        cols,
        { yPercent: -100, duration: 0.6, ease: 'power3.inOut', stagger: 0.045 },
        0.1 + i * 0.08,
      )
    })

    if (heading) {
      const split = SplitText.create(heading, { type: 'words,chars', mask: 'words' })
      tl.from(
        split.chars,
        {
          yPercent: 110,
          duration: 0.7,
          ease: 'expo.out',
          stagger: 0.018,
          onComplete: () => split.revert(),
        },
        0.45,
      )
    }
    if (blocks.length) {
      tl.from(
        blocks,
        {
          autoAlpha: 0,
          y: 28,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.07,
          clearProps: 'all',
        },
        0.55,
      )
    }
  }, [router])

  // Initial load: the overlay starts fully covered, lift it once mounted.
  useGSAP(
    () => {
      layers().forEach((cols, li) => {
        const colors = layerColors(router.state.location.pathname)
        cols.forEach((col) => (col.style.background = colors[li]))
      })
      gsap.set(layers().flat(), { yPercent: 0 })
      const id = requestAnimationFrame(reveal)
      const unsubscribe = router.subscribe('onResolved', (event) => {
        applyPageAttr(event.toLocation.pathname)
        reveal()
      })
      return () => {
        cancelAnimationFrame(id)
        unsubscribe()
      }
    },
    { scope: rootRef },
  )

  useBlocker({
    shouldBlockFn: async ({ current, next }) => {
      // Search-param changes (shareable demo state) never trigger the wipe.
      if (current.pathname === next.pathname) return false
      await cover(next.pathname)
      return false
    },
    enableBeforeUnload: false,
  })

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-auto fixed inset-0 z-[100] overflow-hidden"
    >
      {Array.from({ length: LAYERS }, (_, li) => (
        <div key={li} data-layer className="absolute inset-0 flex">
          {Array.from({ length: COLUMNS }, (_, ci) => (
            <div
              key={ci}
              data-col
              className="-mx-px h-full flex-1 will-change-transform"
              style={{ background: 'var(--background)' }}
            />
          ))}
        </div>
      ))}
      <p
        ref={labelRef}
        className="invisible absolute inset-0 grid place-items-center text-4xl font-semibold tracking-tight text-foreground sm:text-6xl"
      />
    </div>
  )
}
