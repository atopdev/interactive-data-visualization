import { fakeWith } from './fake'

export interface PicsumOptions {
  /** Any string; the same seed always resolves to the same photo. */
  seed: string
  w: number
  h: number
  grayscale?: boolean
  /** Gaussian blur strength, 1–10. */
  blur?: number
  /** Request WebP (default true). */
  webp?: boolean
}

const PICSUM_ORIGIN = 'https://picsum.photos'

/** Build a deterministic picsum.photos URL. */
export function picsum({
  seed,
  w,
  h,
  grayscale,
  blur,
  webp = true,
}: PicsumOptions): string {
  const params = new URLSearchParams()
  if (grayscale) params.set('grayscale', '')
  if (blur !== undefined)
    params.set('blur', String(Math.min(10, Math.max(1, Math.round(blur)))))
  // URLSearchParams renders flags as `grayscale=`; picsum expects a bare flag.
  const query = params.toString().replace(/=(&|$)/g, '$1')
  const ext = webp ? '.webp' : ''
  return `${PICSUM_ORIGIN}/seed/${encodeURIComponent(seed)}/${Math.round(w)}/${Math.round(h)}${ext}${query ? `?${query}` : ''}`
}

export interface PicsumImage {
  id: string
  seed: string
  src: string
  /** Tiny heavily blurred version used as a placeholder. */
  placeholder: string
  width: number
  height: number
  alt: string
  title: string
  category: string
}

const CATEGORIES = ['Nature', 'City', 'People', 'Abstract', 'Travel'] as const
export type PicsumCategory = (typeof CATEGORIES)[number]
export const PICSUM_CATEGORIES: readonly PicsumCategory[] = CATEGORIES

/**
 * A deterministic gallery of `count` images. Seeds, titles, categories and
 * alt text all come from Faker so they are stable across loads.
 */
export function picsumSet(
  prefix: string,
  count: number,
  w: number,
  h: number,
): PicsumImage[] {
  return fakeWith(`picsum:${prefix}`, (f) =>
    Array.from({ length: count }, (_, i) => {
      const adjective = f.word.adjective()
      const noun = f.word.noun()
      const seed = `${prefix}-${i}-${noun}`
      const category = f.helpers.arrayElement(CATEGORIES)
      return {
        id: `${prefix}-${i}`,
        seed,
        src: picsum({ seed, w, h }),
        placeholder: picsum({
          seed,
          w: Math.max(8, Math.round(w / 20)),
          h: Math.max(8, Math.round(h / 20)),
          blur: 2,
        }),
        width: w,
        height: h,
        title: `${adjective.charAt(0).toUpperCase()}${adjective.slice(1)} ${noun}`,
        alt: `${category} photograph: ${adjective} ${noun} near ${f.location.city()}`,
        category,
      }
    }),
  )
}
