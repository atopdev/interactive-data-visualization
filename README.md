# Motion Atlas

An interactive gallery of animated data visualization and UI motion, built as a React single-page app. Six pages each showcase one library (**D3.js**, **Apache ECharts**, **GSAP**, **React Spring**, **Motion** and **React Bits**) with 80+ demos driven by real public data, seeded generated content and seeded photography.

- Every route change is a GSAP overlay wipe that waits for data and lazy chunks before revealing the page.
- Remote data always has a bundled snapshot fallback, so the whole app works offline.
- Dark and light themes, reduced-motion support in every library, and a hard limit of one live WebGL context per page.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script                 | What it does                                                   |
| ---------------------- | -------------------------------------------------------------- |
| `npm run dev`          | Vite dev server (router and Query devtools included)           |
| `npm run build`        | Production build, then a full `tsc -b` type check              |
| `npm run build:fresh`  | Refresh the data snapshots, then build                         |
| `npm run preview`      | Serve the production build                                     |
| `npm run lint`         | ESLint (flat config)                                           |
| `npm run lint:fix`     | ESLint with autofix                                            |
| `npm run format`       | Prettier write (with Tailwind class sorting)                   |
| `npm run format:check` | Prettier check                                                 |
| `npm run typecheck`    | `tsc -b --noEmit`                                              |
| `npm run snapshots`    | Re-fetch every remote dataset into `src/data/snapshots/*.json` |

`npm run lint`, `npm run build` and `npx tsc --noEmit` all pass with zero errors.

## Stack (installed versions)

Everything was installed with `npm install <pkg>@latest` on 2026-09-23 (Node 24.16.0, npm 11.13.0).

| Area             | Packages                                                                                                                                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Core             | react / react-dom 19.3.0, typescript 6.0.3 (strict), vite 8.3.0, @vitejs/plugin-react 6.1.1                                                                                                                                                                                                |
| Routing & data   | @tanstack/react-router 1.170.39, @tanstack/router-plugin 1.168.40, @tanstack/react-query 5.103.2, @tanstack/react-table 9.2.4, zod 4.6.5                                                                                                                                                   |
| Devtools         | @tanstack/react-router-devtools 1.167.2, @tanstack/react-query-devtools 5.103.2 (dev only, lazy-loaded)                                                                                                                                                                                    |
| Styling & UI     | tailwindcss 4.3.3 + @tailwindcss/vite 4.3.3 (CSS-first, no config file), shadcn CLI 4.21.0 (radix base, Nova preset), radix-ui 1.6.7, lucide-react 1.47.0, tw-animate-css 1.4.0, cn 0.4.0                                                                                                  |
| Visualization    | d3 7.9.0, d3-sankey 0.12.3, d3-dsv 3.0.1, topojson-client 3.1.0, world-atlas 2.0.2, echarts 6.1.0, echarts-gl 2.1.0                                                                                                                                                                        |
| Animation        | gsap 3.15.0 + @gsap/react 2.1.2, @react-spring/web 10.1.2 + @react-spring/parallax 10.1.2, @use-gesture/react 10.3.1, motion 13.4.2                                                                                                                                                        |
| React Bits peers | three 0.186.0, ogl 1.0.11, @react-three/fiber 9.8.0, @react-three/drei 10.7.8, postprocessing 6.39.5                                                                                                                                                                                       |
| Content          | @faker-js/faker 10.6.0, @fontsource-variable/geist, geist-mono and roboto-flex 5.3.0                                                                                                                                                                                                       |
| Tooling          | eslint 10.11.0, typescript-eslint 8.70.1, eslint-plugin-react-hooks 7.1.1, eslint-plugin-react-refresh 0.5.7, @tanstack/eslint-plugin-query 5.103.2, @tanstack/eslint-plugin-router 1.162.0, eslint-config-prettier 10.1.8, prettier 3.9.9, prettier-plugin-tailwindcss 0.8.1, tsx 4.23.15 |

### Notes on current versions

- **TanStack Table v9** uses `useTable` with opt-in `tableFeatures(...)` rather than v8's `useReactTable`. The data inspector registers only sorting, global filtering and pagination.
- **echarts-gl 2.1** declares ECharts 6 as a peer and registers onto the same core as `echarts/core`, so the page imports only `echarts-gl/lib/chart/bar3D` and `.../component/grid3D`. It ships no types, so there are ambient declarations in `src/types/echarts-gl.d.ts`.
- **React Bits registry items pin older ranges** (`motion@^12`, `three@^0.180`). After running the shadcn CLI, `motion`, `three` and `gsap` were re-installed at `@latest`.
- **create-vite** now scaffolds oxlint. It was replaced with ESLint as specified.

## Project structure

```
scripts/fetch-snapshots.ts      Fetches every endpoint once and writes trimmed snapshots
src/
  main.tsx                      QueryClient, router (defaultPreload: 'intent'), providers
  routes/                       File-based routes (routeTree.gen.ts is generated, never edited)
    __root.tsx                  Layout shell, header, GSAP transition layer, pending/error/404, devtools
    index.tsx                   Landing page with six live, lazy-loaded library previews
    d3.tsx  echarts.tsx  gsap.tsx  react-spring.tsx  motion.tsx  react-bits.tsx
  features/<library>/
    demos/*.tsx                 One file per demo (or group of related demos)
    queries.ts                  queryOptions factories with snapshot fallback
  components/
    ui/                         shadcn/ui primitives
    react-bits/                 React Bits components (copied in by the shadcn CLI)
    charts/echart.tsx           Typed <EChart option={...} /> wrapper
    page/                       DemoPage, DemoSection, SourceBadge, DataState, SmartImage, controls
    transition/                 GSAP page-transition overlay
    data-inspector.tsx          TanStack Table "data inspector" in a Sheet
    webgl-stage.tsx             Mounts a WebGL child only while it owns the WebGL slot
  hooks/                        Theme, reduced motion, in-view, element size, Coinbase ticker, etc.
  lib/
    fake.ts                     Seeded Faker (faker.seed(20260923)) plus fakeWith(key, fn)
    random.ts                   Dependency-free seeded PRNG (keeps Faker off the landing page)
    picsum.ts                   picsum({ seed, w, h, grayscale?, blur? }) and picsumSet(prefix, n, w, h)
    fetchers.ts                 fetchJson/fetchCsv with an 8s AbortSignal.timeout and snapshot fallback
    sources/*.ts                One Zod-validated client per data provider
    query.ts                    sourcedQuery() and the loader data budget
    webgl-slot.ts               Global "one WebGL context" arbiter
    colors.ts  geo.ts  pages.ts  transition-store.ts  echarts.ts
  data/snapshots/*.json         Real data captured by `npm run snapshots` (each under 200 KB)
```

## Architecture highlights

- **Page transitions.** An async `useBlocker` `shouldBlockFn` plays the cover timeline: staggered panels in the destination page's accent color. It resolves only once the screen is fully covered, so links, programmatic navigation and back/forward are all handled the same way. The reveal runs from `router.subscribe('onResolved')`, after loaders and lazy chunks have settled. The heading then reveals with SplitText and `[data-page-reveal]` blocks stagger in. Scroll resets while covered and ScrollTrigger refreshes afterwards. With reduced motion, the wipe becomes a plain crossfade. Search-param-only navigations skip the transition. The router's `viewTransition` is not used.
- **Data.** Each remote dataset is a `queryOptions` factory in its feature's `queries.ts`. The query function tries the live endpoint once, retrying once on network or 5xx errors but never on timeouts or 429s, with an 8s timeout. On failure it resolves the bundled snapshot, validated with the same Zod schema, and tags it so the section shows an **Offline snapshot** badge. Route loaders call `ensureQueryData` for their datasets but wait at most 2s, so a slow API never holds the overlay. Those sections show skeletons until the data lands.
- **Search params.** Every route validates its search params with Zod, which makes demo state shareable. Examples: `/d3?demo=force&nodes=120`, `/gsap?layout=list&filter=City&demo=flip` and `/react-bits?bg=galaxy`.
- **WebGL.** `useWebGLSlot` lets WebGL demos (React Bits backgrounds, CircularGallery, PixelTrail, SplashCursor, echarts-gl) compete for one global slot. The winner is decided by priority, then by visibility ratio, with hysteresis. Losers unmount, which disposes their context. A browser test confirmed at most one live context at every scroll position. Upstream React Bits components that didn't release their GL context (Particles, CircularGallery, SplashCursor) were patched to do so.
- **Code splitting.** `autoCodeSplitting` splits every route, loaders included. Rolldown groups keep Zod (needed by `validateSearch`) and the data layer out of the entry. three.js, ogl and R3F live only in the React Bits chunk, ECharts only in its route, and each landing preview is its own chunk, loaded when it scrolls into view.
- **Theming.** Colors are CSS variables: an 8-slot categorical palette validated for color-vision deficiency in both modes, sequential and diverging ramps, and a per-page accent. `useChartTheme` resolves them to rgb (via canvas) for D3 canvas and ECharts, and ECharts themes are regenerated on theme change.
- **Performance.** Off-screen animations, live streams and canvas loops pause via IntersectionObserver and `visibilitychange`. The Coinbase WebSocket buffers ticks and flushes once per animation frame straight into `setOption`.

## Demos

### D3.js (`/d3`)

1. Force-directed Nobel network (laureate ↔ category ↔ birth country): drag, zoom/pan, neighbor highlighting, keyed enter/exit when the node count changes (`?nodes=`), and a data inspector
2. Zoomable circle packing of prizes by category and decade (`d3.interpolateZoom`)
3. Bar chart race over OWID population or life expectancy: play, pause, scrub, pauses off-screen, data inspector
4. Canvas orthographic globe with drag-to-rotate, auto-spin, an OWID CO₂ choropleth by year and pulsing USGS earthquakes
5. Wiggle streamgraph of weekly npm downloads whose layers morph smoothly when packages toggle
6. Chord diagram of currency return correlations (Frankfurter) with a threshold and hover-to-isolate
7. Wikimedia pageviews focus+context chart: path-drawing intro, crosshair tooltip, brush-to-zoom
8. Canvas Voronoi/Delaunay particle field with neighbor highlighting
9. Bonus: d3-sankey Nobel flow, a radial temperature year (Open-Meteo archive) and earthquake contour density

### Apache ECharts (`/echarts`)

1. Live BTC-USD stream over the Coinbase WebSocket (rAF-throttled, reconnect with backoff, simulated fallback)
2. Candlestick and volume with MA7/MA30 and linked dataZoom (Coinbase, falling back to the Binance mirror)
3. `realtimeSort` bar race over World Bank population or GDP per capita
4. Force-layout graph of Nobel laureates
5. Sankey of prizes by era → category → gender
6. Calendar heatmap of daily temperatures (high, low, range)
7. Animated gauge dashboard: live weather plus Faker-named KPIs
8. Treemap ↔ sunburst morph with `universalTransition` (World Bank population by region)
9. Radar and parallel coordinates of Pokémon base stats (PokeAPI)
10. Bonus: npm themeRiver, earthquake `effectScatter` on a bundled geo map, and an echarts-gl `bar3D`

### GSAP (`/gsap`)

1. SplitText hero reveal (chars, words or lines, with masks and autoSplit)
2. Pinned horizontal-scroll gallery with `containerAnimation` captions
3. DrawSVG strokes and a five-shape MorphSVG loop
4. MotionPath rocket scrubbed on scroll
5. Flip grid ↔ list with category filtering (state in the URL)
6. Draggable + Inertia throwable profile deck
7. Grid stagger from the clicked cell
8. Magnetic buttons and a cursor follower (`quickTo`)
9. Four-layer picsum parallax scene (scroll plus pointer)
10. Timeline playground: play, pause, reverse, speed, scrub, labels
11. Bonus: Observer-driven slides, ScrambleText, and counters from real npm and USGS data

### React Spring (`/react-spring`)

1. Physics playground (tension, friction, mass) with all six config presets racing
2. `useTrail` text and list entrance
3. `useTransition` list with add, remove, shuffle and auto-height
4. `useChain` sequenced card grid
5. Draggable sortable list (`useSprings` + `useDrag`)
6. Swipeable picsum card deck with velocity-based throws
7. 3D tilt and parallax card
8. Rubber-band pull-to-refresh that really refetches Open-Meteo
9. Pinch, wheel and drag image viewer
10. Counters and SVG progress rings from live weather and BTC data
11. Bonus: `useScroll` parallax, `useInView` reveal, the `Parallax` component and a measured-height accordion

### Motion (`/motion`)

1. `layout`/`layoutId` shared-element gallery → detail modal
2. `AnimatePresence` with `popLayout` (notification stack) and `wait` (stepper)
3. Variants orchestration menu (`staggerChildren`, `delayChildren`, `when`)
4. `Reorder.Group` drag-to-reorder list
5. Drag with constraints, elastic, momentum and `dragSnapToOrigin`
6. `whileHover`, `whileTap`, `whileFocus` and `whileInView` gestures
7. `useScroll` + `useTransform` + `useSpring` parallax and a reading progress bar
8. `useMotionValue`/`useVelocity` cursor blob and a velocity-skewed marquee of Faker companies
9. SVG `pathLength` drawing, an animated checkmark and a path morph
10. Keyframes, spring vs. tween comparison and `useAnimate` sequences
11. Sliding tab indicator (`layoutId`) and `height: "auto"` accordion
12. `LayoutGroup` masonry reflow with 3D card flips
13. Bonus: 3D card stack, per-character text reveal and a rolling-digit live BTC ticker. The whole page is wrapped in `MotionConfig reducedMotion="user"`.

### React Bits (`/react-bits`)

28 components, each in a showcase with live prop controls and a copy-usage snippet:

- **Backgrounds** (one switcher hero, one mounted at a time): Aurora, Particles, Silk, Threads, Waves, Iridescence, Galaxy
- **Text animations:** SplitText, BlurText, ShinyText, DecryptedText, GradientText, CircularText, TextPressure, ScrollReveal, CountUp
- **Animations:** ClickSpark, Magnet, StarBorder, PixelTrail and SplashCursor (both WebGL, off by default)
- **Components:** Dock, Masonry, CircularGallery, TiltedCard, Stack, SpotlightCard, FlowingMenu

Components were installed with `npx shadcn@latest add @react-bits/<Name>-TS-TW`, using the registry `https://reactbits.dev/r/{name}.json` configured in `components.json`. The `components` alias points at `src/components/react-bits`. The copied code was fixed for strict TypeScript and ESLint: all `any` removed, render purity fixed, GL contexts released, external font requests removed and dark-only colors replaced with theme tokens. A narrowly scoped ESLint override for that folder, explained in `eslint.config.js`, disables only the React Compiler rules that conflict with their imperative WebGL patterns.

## Data sources

| Source                                                                                                | Used for                                                       | Endpoint                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Our World in Data](https://ourworldindata.org) (CC BY 4.0)                                           | Bar race, globe choropleth                                     | `ourworldindata.org/grapher/{slug}.csv?v=1&csvType=full&useColumnShortNames=true` for life-expectancy, co-emissions-per-capita and population. `csvType=full` is used because `filtered` returns only a chart's default selection (continents). |
| [World Bank Indicators](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392) (CC BY 4.0) | realtimeSort race, treemap/sunburst                            | `api.worldbank.org/v2/country/all/indicator/{SP.POP.TOTL, NY.GDP.PCAP.CD}`                                                                                                                                                                      |
| [Open-Meteo](https://open-meteo.com) (CC BY 4.0)                                                      | Gauges, rings, pull-to-refresh, calendar heatmap, radial chart | `api.open-meteo.com/v1/forecast`, `archive-api.open-meteo.com/v1/archive`                                                                                                                                                                       |
| [USGS Earthquake Hazards Program](https://earthquake.usgs.gov)                                        | Globe, contours, effectScatter, counters                       | `earthquake.usgs.gov/.../summary/all_week.geojson`                                                                                                                                                                                              |
| [npm downloads API](https://github.com/npm/registry/blob/main/docs/download-counts.md)                | Streamgraph, themeRiver, bar3D, counters                       | `api.npmjs.org/downloads/range/last-year/{pkg}`                                                                                                                                                                                                 |
| [Wikimedia REST API](https://wikimedia.org/api/rest_v1/)                                              | Brush-to-zoom pageviews                                        | `wikimedia.org/api/rest_v1/metrics/pageviews/per-article/...`                                                                                                                                                                                   |
| [Frankfurter](https://frankfurter.dev) (ECB reference rates)                                          | Chord diagram                                                  | `api.frankfurter.dev/v1/latest`, `api.frankfurter.dev/v1/{start}..`                                                                                                                                                                             |
| [Coinbase Exchange](https://docs.cdp.coinbase.com/exchange/)                                          | Live stream, candlesticks, ticker                              | REST candles and `wss://ws-feed.exchange.coinbase.com` (ticker channel)                                                                                                                                                                         |
| [Binance public data](https://data-api.binance.vision)                                                | Backup candles                                                 | `data-api.binance.vision/api/v3/klines`                                                                                                                                                                                                         |
| [Nobel Prize API v2.1](https://www.nobelprize.org/about/developer-zone-2/)                            | Force networks, packing, Sankeys                               | `api.nobelprize.org/2.1/laureates?limit=1000`                                                                                                                                                                                                   |
| [PokeAPI](https://pokeapi.co)                                                                         | Radar and parallel coordinates                                 | `pokeapi.co/api/v2/pokemon/{name}`                                                                                                                                                                                                              |
| [Lorem Picsum](https://picsum.photos)                                                                 | All photography                                                | Seeded URLs `picsum.photos/seed/{seed}/{w}/{h}.webp`                                                                                                                                                                                            |
| [world-atlas](https://github.com/topojson/world-atlas) / Natural Earth                                | Map shapes (bundled, no runtime fetch)                         | npm package                                                                                                                                                                                                                                     |
| [Faker](https://fakerjs.dev)                                                                          | All names, labels, captions and copy (seeded)                  | npm package                                                                                                                                                                                                                                     |

Each demo page also credits its sources in a "Data sources" footer.

## Refreshing snapshots

```bash
npm run snapshots
```

`scripts/fetch-snapshots.ts` (run with `tsx`) fetches every endpoint once through the same source clients the app uses, trims the result (for example, top-N entities, rounded values, M1.5+ quakes) and writes `src/data/snapshots/*.json`. A failing endpoint is reported without stopping the run, and its previous snapshot is kept. The committed snapshots are real data captured on 2026-09-23, when all 13 endpoints responded. The largest file is `nobel.json` at 157 KB. `npm run build:fresh` refreshes the snapshots and then builds.

Snapshots are loaded with dynamic `import()` only by the routes that use them.
