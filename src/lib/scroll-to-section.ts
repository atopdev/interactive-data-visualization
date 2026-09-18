import gsap from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { prefersReducedMotion } from '@/hooks/use-reduced-motion'

gsap.registerPlugin(ScrollToPlugin)

/** Sticky header (3.5rem) plus breathing room. */
const HEADER_OFFSET = 76

interface ScrollOptions {
  /** Called once the section is reached (or immediately with reduced motion). */
  onArrive?: () => void
  /** Called if the user scrolls manually and interrupts the animation. */
  onInterrupt?: () => void
}

let current: gsap.core.Tween | null = null

/**
 * Smoothly scroll the window to a section with an eased GSAP tween whose
 * duration scales with the distance, then flash the section so the eye lands
 * on it and move keyboard focus there. Jumps instantly with reduced motion.
 */
export function scrollToSection(
  id: string,
  { onArrive, onInterrupt }: ScrollOptions = {},
) {
  const el = document.getElementById(id)
  if (!el) return
  current?.kill()

  const arrive = () => {
    current = null
    // Focus for keyboard/screen-reader users without a second scroll jump.
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
    if (!prefersReducedMotion()) {
      el.classList.remove('section-flash')
      // Force a reflow so the animation restarts on repeated clicks.
      void el.offsetWidth
      el.classList.add('section-flash')
    }
    onArrive?.()
  }

  const targetY = window.scrollY + el.getBoundingClientRect().top - HEADER_OFFSET
  if (prefersReducedMotion()) {
    window.scrollTo({ top: targetY, behavior: 'instant' })
    arrive()
    return
  }

  const distance = Math.abs(targetY - window.scrollY)
  current = gsap.to(window, {
    duration: gsap.utils.clamp(0.5, 1.4, distance / 2400 + 0.4),
    ease: 'power3.inOut',
    scrollTo: { y: el, offsetY: HEADER_OFFSET, autoKill: true },
    onComplete: arrive,
    onAutoKill: () => {
      current = null
      onInterrupt?.()
    },
  })
}
