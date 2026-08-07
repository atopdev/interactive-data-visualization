import { useEffect, useState } from 'react'

/**
 * Track which section is currently "in view" for the table of contents: the
 * last section whose top has crossed a line 35% down the viewport.
 */
export function useActiveSection(ids: readonly string[]): string | undefined {
  const [active, setActive] = useState<string | undefined>(ids[0])

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (elements.length === 0) return

    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * 0.35
      let current = elements[0].id
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= line) current = el.id
        else break
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ids])

  return active
}
