import gsap from 'gsap'
import { PAGES, type PageId } from '@/lib/pages'

/**
 * Per-page route transitions. Each effect is themed on its library:
 *
 * - home          shutter: columns in every page's accent, opening from the center
 * - d3            liquid: curved SVG shapes rising like an area chart
 * - echarts       bars: a bar chart animates in, then fills the screen
 * - gsap          blades: skewed panels sweeping across on expo easing
 * - react-spring  spring: a ball pops from the click on an elastic ease, then floods out
 * - motion        morph: a shared-layout grow from the clicked link's box
 * - react-bits    pixels: a random pixel dissolve
 *
 * An effect builds its own DOM inside the overlay stage and hands back two
 * timelines: `cover` ends with the screen fully covered in `palette.surface`
 * (the page title is shown over it) and `reveal` uncovers the new page.
 */

export interface Palette {
  deep: string
  accent: string
  light: string
  /** Color of the fully covered screen; the title label sits on it. */
  surface: string
}

export interface EffectContext {
  stage: HTMLElement
  palette: Palette
  width: number
  height: number
  /** Where the navigation started: the click point and the clicked element's box. */
  origin: { x: number; y: number; rect: DOMRect | null }
}

export interface EffectInstance {
  cover: () => gsap.core.Timeline
  reveal: () => gsap.core.Timeline
}

/** How the new page's heading animates in once the overlay lifts. */
interface HeadingIntro {
  split: 'chars' | 'words'
  mask: boolean
  from: gsap.TweenVars
}

export interface TransitionEffect {
  name: string
  create: (ctx: EffectContext) => EffectInstance
  heading: HeadingIntro
  /** Entrance for the page's `[data-page-reveal]` blocks. */
  blocks: gsap.TweenVars
}

function div(
  parent: Element,
  style: Partial<CSSStyleDeclaration>,
): HTMLDivElement {
  const el = document.createElement('div')
  Object.assign(el.style, style)
  parent.append(el)
  return el
}

const fill = (parent: Element, background: string) =>
  div(parent, { position: 'absolute', inset: '0', background })

const DEFAULT_BLOCKS: gsap.TweenVars = {
  autoAlpha: 0,
  y: 28,
  duration: 0.6,
  ease: 'power3.out',
  stagger: 0.07,
}

const PAGE_ACCENTS = PAGES.map((p) => `var(${p.accentVar})`)

const shutter: TransitionEffect = {
  name: 'shutter',
  create: ({ stage, palette, width }) => {
    const count = width < 640 ? 4 : 6
    // Home spans every library: one column per page accent, then the surface.
    const layers = [PAGE_ACCENTS, [palette.surface]].map((colors) => {
      const row = div(stage, {
        position: 'absolute',
        inset: '0',
        display: 'flex',
      })
      return Array.from({ length: count }, (_, i) =>
        div(row, {
          flex: '1',
          margin: '0 -1px',
          background: colors[i % colors.length],
        }),
      )
    })
    gsap.set(layers.flat(), { yPercent: 100 })
    const stagger = { each: 0.05, from: 'center' } as const
    return {
      cover: () => {
        const tl = gsap.timeline()
        layers.forEach((cols, i) =>
          tl.to(
            cols,
            { yPercent: 0, duration: 0.6, ease: 'power4.inOut', stagger },
            i * 0.1,
          ),
        )
        return tl
      },
      reveal: () => {
        const tl = gsap.timeline()
        ;[...layers]
          .reverse()
          .forEach((cols, i) =>
            tl.to(
              cols,
              { yPercent: -100, duration: 0.6, ease: 'power4.inOut', stagger },
              i * 0.08,
            ),
          )
        return tl
      },
    }
  },
  heading: {
    split: 'chars',
    mask: true,
    from: { yPercent: 110, duration: 0.7, ease: 'expo.out', stagger: 0.018 },
  },
  blocks: DEFAULT_BLOCKS,
}

const SVG_NS = 'http://www.w3.org/2000/svg'

const liquid: TransitionEffect = {
  name: 'liquid',
  create: ({ stage, palette }) => {
    const svg = document.createElementNS(SVG_NS, 'svg')
    svg.setAttribute('viewBox', '0 0 100 100')
    svg.setAttribute('preserveAspectRatio', 'none')
    Object.assign(svg.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
    })
    stage.append(svg)
    const paths = [palette.deep, palette.accent, palette.surface].map(
      (color) => {
        const path = document.createElementNS(SVG_NS, 'path')
        path.style.fill = color
        svg.append(path)
        return path
      },
    )
    // The edge bows most mid-flight, like an area chart easing between states.
    const bow = (p: number) => Math.sin(p * Math.PI) * 45
    const rising = (p: number) => {
      const y = 100 - p * 100
      return `M0 100 V${y} Q50 ${y - bow(p)} 100 ${y} V100 Z`
    }
    const lifting = (p: number) => {
      const y = 100 - p * 100
      return `M0 0 H100 V${y} Q50 ${y - bow(p)} 0 ${y} Z`
    }
    paths.forEach((path) => path.setAttribute('d', rising(0)))
    const drive = (
      tl: gsap.core.Timeline,
      path: SVGPathElement,
      shape: (p: number) => string,
      at: number,
    ) => {
      const state = { p: 0 }
      tl.to(
        state,
        {
          p: 1,
          duration: 0.85,
          ease: 'power2.inOut',
          onUpdate: () => path.setAttribute('d', shape(state.p)),
        },
        at,
      )
    }
    return {
      cover: () => {
        const tl = gsap.timeline()
        paths.forEach((path, i) => drive(tl, path, rising, i * 0.12))
        return tl
      },
      reveal: () => {
        const tl = gsap.timeline()
        ;[...paths]
          .reverse()
          .forEach((path, i) => drive(tl, path, lifting, i * 0.12))
        return tl
      },
    }
  },
  heading: {
    split: 'chars',
    mask: true,
    from: {
      yPercent: 120,
      rotate: 6,
      duration: 0.9,
      ease: 'power4.out',
      stagger: 0.02,
    },
  },
  blocks: DEFAULT_BLOCKS,
}

const bars: TransitionEffect = {
  name: 'bars',
  create: ({ stage, palette, width }) => {
    const count = width < 640 ? 8 : 14
    const row = div(stage, {
      position: 'absolute',
      inset: '0',
      display: 'flex',
    })
    // A sequential ramp from the accent to its deep shade, like a bar series.
    const columns = Array.from({ length: count }, (_, i) =>
      div(row, {
        flex: '1',
        margin: '0 -0.5px',
        transformOrigin: '50% 100%',
        background: `color-mix(in oklab, ${palette.accent} ${Math.round(100 - (i / (count - 1)) * 65)}%, ${palette.deep})`,
      }),
    )
    const panel = fill(stage, palette.surface)
    gsap.set(columns, { scaleY: 0 })
    gsap.set(panel, { scaleY: 0, transformOrigin: '50% 100%' })
    return {
      cover: () =>
        gsap
          .timeline()
          .to(columns, {
            scaleY: () => gsap.utils.random(0.2, 0.8),
            duration: 0.45,
            ease: 'back.out(1.6)',
            stagger: 0.025,
          })
          .to(
            columns,
            {
              scaleY: 1,
              duration: 0.4,
              ease: 'power3.inOut',
              stagger: { each: 0.02, from: 'random' },
            },
            '-=0.05',
          )
          .to(
            panel,
            { scaleY: 1, duration: 0.45, ease: 'power3.inOut' },
            '-=0.2',
          ),
      reveal: () =>
        gsap
          .timeline()
          .set(panel, { transformOrigin: '50% 0%' })
          .to(panel, { scaleY: 0, duration: 0.45, ease: 'power3.inOut' })
          .to(
            columns,
            {
              scaleY: 0,
              duration: 0.5,
              ease: 'power3.inOut',
              stagger: { each: 0.03, from: 'random' },
            },
            0.2,
          ),
    }
  },
  heading: {
    split: 'chars',
    mask: false,
    from: {
      scaleY: 0,
      transformOrigin: '50% 100%',
      duration: 0.6,
      ease: 'back.out(2)',
      stagger: 0.025,
    },
  },
  blocks: { ...DEFAULT_BLOCKS, y: 0, scaleY: 0.9, transformOrigin: '50% 100%' },
}

const blades: TransitionEffect = {
  name: 'blades',
  create: ({ stage, palette }) => {
    const panels = [
      palette.deep,
      palette.accent,
      palette.light,
      palette.surface,
    ].map((background) =>
      div(stage, {
        position: 'absolute',
        top: '0',
        bottom: '0',
        left: '-25%',
        width: '150%',
        background,
      }),
    )
    gsap.set(panels, { skewX: -14, xPercent: 115 })
    return {
      cover: () =>
        gsap.timeline().to(panels, {
          xPercent: 0,
          duration: 0.75,
          ease: 'expo.inOut',
          stagger: 0.08,
        }),
      reveal: () =>
        gsap.timeline().to([...panels].reverse(), {
          xPercent: -115,
          duration: 0.75,
          ease: 'expo.inOut',
          stagger: 0.08,
        }),
    }
  },
  heading: {
    split: 'chars',
    mask: false,
    from: {
      rotationX: -90,
      autoAlpha: 0,
      transformPerspective: 600,
      transformOrigin: '50% 50% -30px',
      duration: 0.8,
      ease: 'back.out(1.7)',
      stagger: 0.03,
    },
  },
  blocks: { ...DEFAULT_BLOCKS, y: 0, x: -40, ease: 'expo.out' },
}

const spring: TransitionEffect = {
  name: 'spring',
  create: ({ stage, palette, width, height, origin }) => {
    const [ball, flood] = [palette.accent, palette.surface].map((c) =>
      fill(stage, c),
    )
    const { x, y } = origin
    const cover =
      Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) + 2
    const clip = (el: HTMLElement, r: number) => {
      el.style.clipPath = `circle(${Math.max(0, r)}px at ${x}px ${y}px)`
    }
    // Reveal punches a hole from the center of the screen.
    const cx = width / 2
    const cy = height / 2
    const opening = Math.hypot(cx, cy) + 2
    const hole = (el: HTMLElement, r: number) => {
      const r0 = Math.max(0, r)
      const mask = `radial-gradient(circle at ${cx}px ${cy}px, transparent ${r0}px, #000 ${r0 + 1}px)`
      el.style.setProperty('mask-image', mask)
      el.style.setProperty('-webkit-mask-image', mask)
    }
    clip(ball, 0)
    clip(flood, 0)
    const radius = (
      tl: gsap.core.Timeline,
      apply: (r: number) => void,
      from: number,
      to: number,
      vars: gsap.TweenVars,
      at: number | string,
    ) => {
      const state = { r: from }
      tl.to(state, { r: to, ...vars, onUpdate: () => apply(state.r) }, at)
    }
    return {
      cover: () => {
        const tl = gsap.timeline()
        radius(
          tl,
          (r) => clip(ball, r),
          0,
          72,
          { duration: 0.55, ease: 'elastic.out(1, 0.4)' },
          0,
        )
        radius(
          tl,
          (r) => clip(ball, r),
          72,
          cover,
          { duration: 0.45, ease: 'power3.in' },
          0.5,
        )
        radius(
          tl,
          (r) => clip(flood, r),
          0,
          cover,
          { duration: 0.55, ease: 'power3.inOut' },
          0.62,
        )
        return tl
      },
      reveal: () => {
        const tl = gsap.timeline()
        tl.set([ball, flood], { clipPath: 'none' })
        radius(
          tl,
          (r) => hole(flood, r),
          0,
          opening,
          { duration: 0.6, ease: 'power3.inOut' },
          0,
        )
        radius(
          tl,
          (r) => hole(ball, r),
          0,
          opening,
          { duration: 0.7, ease: 'back.inOut(1.4)' },
          0.1,
        )
        return tl
      },
    }
  },
  heading: {
    split: 'chars',
    mask: false,
    from: {
      y: 40,
      scale: 0.4,
      autoAlpha: 0,
      duration: 1.1,
      ease: 'elastic.out(1, 0.45)',
      stagger: 0.03,
    },
  },
  blocks: { ...DEFAULT_BLOCKS, y: 48, duration: 0.9, ease: 'back.out(1.6)' },
}

const morph: TransitionEffect = {
  name: 'morph',
  create: ({ stage, palette, width, height, origin }) => {
    const layers = [palette.accent, palette.surface].map((c) => fill(stage, c))
    // Grow from the clicked link's box, like a shared-layout animation.
    const rect =
      origin.rect ?? new DOMRect(width / 2 - 100, height / 2 - 32, 200, 64)
    const r = Math.min(rect.height / 2, 32)
    const start = `inset(${rect.top}px ${width - rect.right}px ${height - rect.bottom}px ${rect.left}px round ${r}px ${r}px ${r}px ${r}px)`
    const full = 'inset(0px 0px 0px 0px round 0px 0px 0px 0px)'
    const lifted = `inset(0px 0px ${height}px 0px round 0px 0px 48px 48px)`
    gsap.set(layers, { clipPath: start, autoAlpha: 0 })
    return {
      cover: () =>
        gsap.timeline().set(layers, { autoAlpha: 1 }).to(layers, {
          clipPath: full,
          duration: 0.8,
          ease: 'expo.inOut',
          stagger: 0.1,
        }),
      reveal: () =>
        gsap.timeline().fromTo(
          [...layers].reverse(),
          { clipPath: full },
          {
            clipPath: lifted,
            duration: 0.8,
            ease: 'expo.inOut',
            stagger: 0.1,
          },
        ),
    }
  },
  heading: {
    split: 'words',
    mask: false,
    from: {
      autoAlpha: 0,
      y: 16,
      filter: 'blur(12px)',
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.08,
    },
  },
  blocks: { ...DEFAULT_BLOCKS, y: 16, scale: 0.97, filter: 'blur(8px)' },
}

const pixels: TransitionEffect = {
  name: 'pixels',
  create: ({ stage, palette, width, height }) => {
    const size = Math.max(56, Math.ceil(Math.sqrt((width * height) / 260)))
    const cols = Math.ceil(width / size)
    const rows = Math.ceil(height / size)
    const grid = (colors: string[]) => {
      const el = div(stage, {
        position: 'absolute',
        inset: '0',
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gridAutoRows: `${size}px`,
      })
      return Array.from({ length: cols * rows }, () =>
        // 1px overlap hides sub-pixel seams between cells.
        div(el, {
          width: `${size + 1}px`,
          height: `${size + 1}px`,
          background: gsap.utils.random(colors),
        }),
      )
    }
    const glitch = grid([palette.deep, palette.accent, palette.light])
    const solid = grid([palette.surface])
    gsap.set([...glitch, ...solid], { autoAlpha: 0 })
    return {
      cover: () =>
        gsap
          .timeline()
          .to(glitch, {
            autoAlpha: 1,
            duration: 0.05,
            stagger: { amount: 0.4, from: 'random' },
          })
          .to(
            solid,
            {
              autoAlpha: 1,
              duration: 0.05,
              stagger: { amount: 0.35, from: 'random' },
            },
            0.25,
          ),
      reveal: () =>
        gsap
          .timeline()
          .to(solid, {
            autoAlpha: 0,
            duration: 0.05,
            stagger: { amount: 0.35, from: 'random' },
          })
          .to(
            glitch,
            {
              scale: 0,
              duration: 0.25,
              ease: 'power2.in',
              stagger: { amount: 0.4, from: 'random' },
            },
            0.15,
          ),
    }
  },
  heading: {
    split: 'chars',
    mask: false,
    from: {
      autoAlpha: 0,
      duration: 0.05,
      stagger: { amount: 0.5, from: 'random' },
    },
  },
  blocks: { ...DEFAULT_BLOCKS, y: 0, duration: 0.4, ease: 'steps(5)' },
}

/** Reduced motion: a short crossfade and no content choreography. */
export const FADE: TransitionEffect = {
  name: 'fade',
  create: ({ stage, palette }) => {
    const layer = fill(stage, palette.surface)
    gsap.set(layer, { autoAlpha: 0 })
    return {
      cover: () => gsap.timeline().to(layer, { autoAlpha: 1, duration: 0.2 }),
      reveal: () => gsap.timeline().to(layer, { autoAlpha: 0, duration: 0.25 }),
    }
  },
  heading: { split: 'words', mask: false, from: {} },
  blocks: {},
}

const BY_PAGE: Record<PageId, TransitionEffect> = {
  d3: liquid,
  echarts: bars,
  gsap: blades,
  'react-spring': spring,
  motion: morph,
  'react-bits': pixels,
}

export function effectFor(pageId: PageId | undefined): TransitionEffect {
  return pageId ? BY_PAGE[pageId] : shutter
}

export function paletteFor(accentVar: string | undefined): Palette {
  const accent = accentVar ? `var(${accentVar})` : 'var(--foreground)'
  return {
    deep: `color-mix(in oklab, ${accent} 55%, black)`,
    accent,
    light: `color-mix(in oklab, ${accent} 65%, white)`,
    surface: `color-mix(in oklab, ${accent} 12%, var(--background))`,
  }
}
