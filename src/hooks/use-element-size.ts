import { useEffect, useState, type RefObject } from 'react'

export interface Size {
  width: number
  height: number
}

/** Track an element's content-box size with ResizeObserver. */
export function useElementSize<T extends Element>(ref: RefObject<T | null>): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((prev) =>
        Math.round(prev.width) === Math.round(width) &&
        Math.round(prev.height) === Math.round(height)
          ? prev
          : { width: Math.round(width), height: Math.round(height) },
      )
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}
