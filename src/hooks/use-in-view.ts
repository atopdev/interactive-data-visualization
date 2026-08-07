import { useEffect, useState, type RefObject } from 'react'

export interface InViewOptions {
  rootMargin?: string
  threshold?: number
  /** Stay true after the first intersection. */
  once?: boolean
}

/** IntersectionObserver-backed visibility flag; used to pause off-screen work. */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { rootMargin = '0px', threshold = 0, once = false }: InViewOptions = {},
): boolean {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (entry.isIntersecting && once) io.disconnect()
      },
      { rootMargin, threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin, threshold, once])
  return inView
}
