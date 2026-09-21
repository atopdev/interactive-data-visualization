import { useGSAP } from '@gsap/react'
import { useBlocker, useRouter } from '@tanstack/react-router'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { useCallback, useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/hooks/use-reduced-motion'
import { pageForPath } from '@/lib/pages'
import { getTransitionPhase, setTransitionPhase } from '@/lib/transition-store'
import {
  effectFor,
  FADE,
  paletteFor,
  type EffectContext,
  type EffectInstance,
  type TransitionEffect,
} from './effects'

gsap.registerPlugin(useGSAP, SplitText)

function applyPageAttr(pathname: string) {
  const page = pageForPath(pathname)
  const root = document.documentElement
  if (page) root.dataset.page = page.id
  else delete root.dataset.page
}

/** The last click, so effects can start where the navigation did. */
const lastClick = { x: 0, y: 0, rect: null as DOMRect | null, at: 0 }

function clickOrigin(): EffectContext['origin'] {
  if (performance.now() - lastClick.at > 1500) {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2, rect: null }
  }
  return { x: lastClick.x, y: lastClick.y, rect: lastClick.rect }
}

/**
 * Full-screen GSAP transition between routes, with a different effect per
 * destination page (see `effects.ts`).
 *
 * - Cover: an async `useBlocker` hook plays the destination's cover timeline
 *   and only then lets the navigation proceed, so it works for links,
 *   programmatic navigation and browser back/forward alike.
 * - Reveal: triggered from `router.subscribe('onResolved')`, i.e. after
 *   loaders and lazy route chunks have resolved underneath the overlay. The
 *   same effect uncovers the page, then its heading and blocks animate in.
 * - Reduced motion: a plain crossfade.
 */
export function PageTransition() {
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLParagraphElement>(null)
  const taglineRef = useRef<HTMLParagraphElement>(null)
  const coverRef = useRef<Promise<void> | null>(null)
  const activeRef = useRef<{
    effect: TransitionEffect
    instance: EffectInstance
  } | null>(null)
  const revealRef = useRef<{
    tl: gsap.core.Timeline
    cleanup: () => void
  } | null>(null)

  /** Build the effect for a destination inside a fresh stage. */
  const mount = useCallback((pathname: string) => {
    const stage = stageRef.current
    if (!stage) return null
    stage.replaceChildren()
    const page = pageForPath(pathname)
    const effect = prefersReducedMotion() ? FADE : effectFor(page?.id)
    const instance = effect.create({
      stage,
      palette: paletteFor(page?.accentVar),
      width: window.innerWidth,
      height: window.innerHeight,
      origin: clickOrigin(),
    })
    activeRef.current = { effect, instance }
    return instance
  }, [])

  const cover = useCallback(
    (toPath: string): Promise<void> => {
      const phase = getTransitionPhase()
      if (phase === 'covered') return Promise.resolve()
      if (phase === 'covering' && coverRef.current) return coverRef.current

      // A navigation during the reveal: stop it and start covering again.
      if (revealRef.current) {
        revealRef.current.tl.kill()
        revealRef.current.cleanup()
        revealRef.current = null
      }
      setTransitionPhase('covering')
      const root = rootRef.current
      const instance = mount(toPath)
      if (!root || !instance) return Promise.resolve()
      const page = pageForPath(toPath)
      if (titleRef.current) titleRef.current.textContent = page?.title ?? 'Home'
      if (taglineRef.current)
        taglineRef.current.textContent = page?.tagline ?? 'Interactive Data Visualization'

      coverRef.current = new Promise<void>((resolve) => {
        const done = () => {
          applyPageAttr(toPath)
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
          setTransitionPhase('covered')
          coverRef.current = null
          resolve()
        }
        gsap.set(root, { pointerEvents: 'auto', autoAlpha: 1 })
        const tl = gsap.timeline({ onComplete: done }).add(instance.cover())
        if (!prefersReducedMotion()) {
          tl.fromTo(
            labelRef.current,
            { autoAlpha: 0, y: 16 },
            { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' },
            '-=0.2',
          )
        }
      })
      return coverRef.current
    },
    [mount],
  )

  const reveal = useCallback(() => {
    const root = rootRef.current
    const active = activeRef.current
    // Only lift a covered overlay; the initial rAF and the first onResolved can both fire.
    if (!root || !active || getTransitionPhase() !== 'covered') return
    setTransitionPhase('revealing')
    applyPageAttr(router.state.location.pathname)
    const { effect, instance } = active

    const main = document.querySelector('main')
    const heading = main?.querySelector<HTMLElement>('[data-page-heading]')
    const blocks = main ? gsap.utils.toArray<HTMLElement>('[data-page-reveal]', main) : []
    let split: SplitText | null = null
    const cleanup = () => {
      split?.revert()
      split = null
      gsap.set(blocks, { clearProps: 'all' })
    }

    const finish = () => {
      cleanup()
      revealRef.current = null
      stageRef.current?.replaceChildren()
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

    const tl = gsap.timeline({ onComplete: finish })
    revealRef.current = { tl, cleanup }
    tl.to(labelRef.current, {
      autoAlpha: 0,
      y: -12,
      duration: 0.2,
      ease: 'power2.in',
    })
    tl.add(instance.reveal(), 0.1)
    if (effect === FADE) return

    if (heading) {
      const { split: by, mask, from } = effect.heading
      split = SplitText.create(heading, {
        type: by === 'chars' ? 'words,chars' : 'words',
        ...(mask ? { mask: 'words' as const } : {}),
      })
      const targets = by === 'chars' ? split.chars : split.words
      // Filters need an explicit end value; the computed "none" does not interpolate.
      if (from.filter) gsap.set(targets, { filter: 'blur(0px)' })
      tl.from(targets, from, 0.45)
    }
    if (blocks.length) {
      if (effect.blocks.filter) gsap.set(blocks, { filter: 'blur(0px)' })
      tl.from(blocks, effect.blocks, 0.55)
    }
  }, [router])

  // Initial load: the overlay starts opaque; build the page's effect in its
  // covered state and lift it once mounted.
  useGSAP(
    () => {
      const instance = mount(router.state.location.pathname)
      instance?.cover().progress(1).kill()
      if (rootRef.current) rootRef.current.style.background = 'transparent'
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

  // Remember where navigations start (pointer position and the clicked link).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target.closest('a, button') : null
      const rect = target?.getBoundingClientRect() ?? null
      // Keyboard activation reports (0, 0): use the element's center instead.
      const fromKeyboard = e.detail === 0 && rect
      lastClick.x = fromKeyboard ? rect.left + rect.width / 2 : e.clientX
      lastClick.y = fromKeyboard ? rect.top + rect.height / 2 : e.clientY
      lastClick.rect = rect
      lastClick.at = performance.now()
    }
    window.addEventListener('click', onClick, { capture: true })
    return () => window.removeEventListener('click', onClick, { capture: true })
  }, [])

  useBlocker({
    shouldBlockFn: async ({ current, next }) => {
      // Search-param changes (shareable demo state) never trigger the transition.
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
      style={{ background: 'var(--background)' }}
    >
      <div ref={stageRef} className="absolute inset-0" />
      <div
        ref={labelRef}
        className="invisible absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
      >
        <p
          ref={titleRef}
          className="text-4xl font-semibold tracking-tight text-foreground sm:text-6xl"
        />
        <p ref={taglineRef} className="text-sm text-muted-foreground sm:text-base" />
      </div>
    </div>
  )
}
