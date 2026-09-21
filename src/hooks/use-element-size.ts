import { useEffect, useState, type RefObject } from 'react'

export interface Size {
  width: number
  height: number
}

/** Track an element's border-box size (includes padding) with ResizeObserver. */
export function useElementSize<T extends Element>(
  ref: RefObject<T | null>,
): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0]
      const width = box ? box.inlineSize : entry.contentRect.width
      const height = box ? box.blockSize : entry.contentRect.height
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
