import { useState, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

export interface SmartImageProps {
  src: string
  alt: string
  width: number
  height: number
  /** Tiny blurred image shown until the full image has loaded. */
  placeholder?: string
  /** Above-the-fold images load eagerly. */
  priority?: boolean
  className?: string
  imgClassName?: string
  style?: CSSProperties
  draggable?: boolean
}

/**
 * picsum image in a fixed aspect-ratio box: a pulsing skeleton (or blurred
 * placeholder) crossfades to the real image on load, so there is no layout
 * shift and no flash of empty space.
 */
export function SmartImage({
  src,
  alt,
  width,
  height,
  placeholder,
  priority,
  className,
  imgClassName,
  style,
  draggable,
}: SmartImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const loaded = loadedSrc === src
  return (
    <div
      className={cn('relative overflow-hidden bg-muted', className)}
      style={{ aspectRatio: `${width} / ${height}`, ...style }}
    >
      {placeholder ? (
        <img
          src={placeholder}
          alt=""
          aria-hidden
          width={width}
          height={height}
          decoding="async"
          draggable={false}
          className={cn(
            'absolute inset-0 size-full scale-110 object-cover blur-lg transition-opacity duration-500',
            loaded && 'opacity-0',
          )}
        />
      ) : (
        <div
          aria-hidden
          className={cn(
            'absolute inset-0 animate-pulse bg-muted transition-opacity duration-500',
            loaded && 'opacity-0',
          )}
        />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        draggable={draggable}
        onLoad={() => setLoadedSrc(src)}
        className={cn(
          'relative size-full object-cover transition-opacity duration-700',
          loaded ? 'opacity-100' : 'opacity-0',
          imgClassName,
        )}
      />
    </div>
  )
}
