/**
 * Resolve CSS custom properties into concrete `rgb()/rgba()` strings.
 *
 * Theme tokens are authored in oklch, which canvas-based libraries (ECharts'
 * zrender, D3 interpolators) cannot parse. Painting the value onto a 1×1
 * canvas and reading the pixel back gives a universally understood color.
 */

let ctx: CanvasRenderingContext2D | null = null
const cache = new Map<string, string>()

export function toRgb(color: string): string {
  const key = color.trim()
  const hit = cache.get(key)
  if (hit) return hit
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(key) || key.startsWith('rgb')) {
    cache.set(key, key)
    return key
  }
  ctx ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!ctx) return key
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = '#000'
  ctx.fillStyle = key
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  const out =
    a === 255
      ? `rgb(${r}, ${g}, ${b})`
      : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`
  cache.set(key, out)
  return out
}

export function cssVar(name: string, el: Element = document.documentElement): string {
  return toRgb(getComputedStyle(el).getPropertyValue(name).trim() || '#888')
}

/** Mix a color with transparency (works for any CSS color). */
export function alpha(color: string, opacity: number): string {
  const rgb = toRgb(color)
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return color
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${opacity})`
}

export interface ChartTheme {
  mode: 'light' | 'dark'
  series: string[]
  foreground: string
  muted: string
  background: string
  card: string
  border: string
  grid: string
  accent: string
  seq: [string, string, string, string]
  div: [string, string, string]
  font: string
}

export function readChartTheme(el: Element = document.documentElement): ChartTheme {
  const v = (n: string) => cssVar(n, el)
  return {
    mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    series: Array.from({ length: 8 }, (_, i) => v(`--series-${i + 1}`)),
    foreground: v('--foreground'),
    muted: v('--muted-foreground'),
    background: v('--background'),
    card: v('--card'),
    border: v('--border'),
    grid: v('--grid'),
    accent: v('--page-accent'),
    seq: [v('--seq-100'), v('--seq-300'), v('--seq-500'), v('--seq-700')],
    div: [v('--div-neg'), v('--div-mid'), v('--div-pos')],
    font: getComputedStyle(document.body).fontFamily,
  }
}
