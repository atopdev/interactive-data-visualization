/** Metadata for the six demo pages: navigation, transitions, landing cards. */
export const PAGES = [
  {
    id: 'd3',
    to: '/d3',
    title: 'D3.js',
    group: 'Data Viz',
    tagline: 'Bespoke, data-driven SVG and canvas',
    description:
      'Force networks, globes, chord diagrams, bar races and streamgraphs built from first principles.',
    accentVar: '--accent-d3',
  },
  {
    id: 'echarts',
    to: '/echarts',
    title: 'Apache ECharts',
    group: 'Data Viz',
    tagline: 'Declarative, high-performance charts',
    description:
      'Live streaming prices, candlesticks, calendar heatmaps, Sankeys and morphing hierarchies.',
    accentVar: '--accent-echarts',
  },
  {
    id: 'gsap',
    to: '/gsap',
    title: 'GSAP',
    group: 'Motion & UI',
    tagline: 'Timeline-driven motion and scroll',
    description:
      'SplitText, ScrollTrigger, Flip, Draggable, MorphSVG and every other plugin, now free.',
    accentVar: '--accent-gsap',
  },
  {
    id: 'react-spring',
    to: '/react-spring',
    title: 'React Spring',
    group: 'Motion & UI',
    tagline: 'Physics-based springs',
    description:
      'Trails, transitions, chains and gesture-driven springs with real tension and friction.',
    accentVar: '--accent-spring',
  },
  {
    id: 'motion',
    to: '/motion',
    title: 'Motion',
    group: 'Motion & UI',
    tagline: 'Layout animation for React',
    description:
      'Shared layout, presence, reorder, drag, scroll-linked values and imperative sequences.',
    accentVar: '--accent-motion',
  },
  {
    id: 'react-bits',
    to: '/react-bits',
    title: 'React Bits',
    group: 'Motion & UI',
    tagline: 'Copy-in animated components',
    description:
      'Text effects, cursors, galleries and WebGL backgrounds installed through the shadcn registry.',
    accentVar: '--accent-bits',
  },
] as const

export type PageMeta = (typeof PAGES)[number]
export type PageId = PageMeta['id']

export const PAGE_GROUPS = ['Data Viz', 'Motion & UI'] as const

export function pageById(id: PageId): PageMeta {
  const page = PAGES.find((p) => p.id === id)
  if (!page) throw new Error(`Unknown page ${id}`)
  return page
}

/** Resolve the page for a pathname, if it is one of the demo pages. */
export function pageForPath(pathname: string): PageMeta | undefined {
  return PAGES.find((p) => pathname === p.to || pathname.startsWith(`${p.to}/`))
}

export function neighbors(id: PageId): { prev: PageMeta; next: PageMeta } {
  const i = PAGES.findIndex((p) => p.id === id)
  return {
    prev: PAGES[(i - 1 + PAGES.length) % PAGES.length],
    next: PAGES[(i + 1) % PAGES.length],
  }
}
