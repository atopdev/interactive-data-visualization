import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { DemoPage, type TocEntry } from '@/components/page/demo-page'
import { BarRaceDemo } from '@/features/d3/demos/bar-race'
import { D3BonusDemo } from '@/features/d3/demos/bonus'
import { ChordDemo } from '@/features/d3/demos/chord'
import { CirclePackDemo } from '@/features/d3/demos/circle-pack'
import { ForceNetworkDemo } from '@/features/d3/demos/force-network'
import { GlobeDemo } from '@/features/d3/demos/globe'
import { PageviewsDemo } from '@/features/d3/demos/pageviews'
import { StreamgraphDemo } from '@/features/d3/demos/streamgraph'
import { VoronoiDemo } from '@/features/d3/demos/voronoi'
import {
  fxQuery,
  nobelQuery,
  npmDownloadsQuery,
  owidQuery,
  pageviewsQuery,
  quakesQuery,
  temperatureYearQuery,
} from '@/features/d3/queries'
import { ensureWithBudget } from '@/lib/query'

const searchSchema = z.object({
  demo: z.string().optional().catch(undefined),
  nodes: z.coerce.number().int().min(40).max(400).optional().catch(undefined),
})

export const Route = createFileRoute('/d3')({
  validateSearch: searchSchema,
  loader: ({ context: { queryClient } }) =>
    ensureWithBudget([
      queryClient.ensureQueryData(nobelQuery()),
      queryClient.ensureQueryData(owidQuery('life-expectancy')),
      queryClient.ensureQueryData(owidQuery('co-emissions-per-capita')),
      queryClient.ensureQueryData(quakesQuery()),
      queryClient.ensureQueryData(npmDownloadsQuery()),
      queryClient.ensureQueryData(fxQuery()),
      queryClient.ensureQueryData(pageviewsQuery()),
      queryClient.ensureQueryData(temperatureYearQuery()),
    ]),
  component: D3Page,
})

const TOC: TocEntry[] = [
  { id: 'force', title: 'Force network' },
  { id: 'pack', title: 'Circle packing' },
  { id: 'bar-race', title: 'Bar chart race' },
  { id: 'globe', title: 'Globe' },
  { id: 'streamgraph', title: 'Streamgraph' },
  { id: 'chord', title: 'Chord diagram' },
  { id: 'pageviews', title: 'Brush & zoom' },
  { id: 'voronoi', title: 'Voronoi field' },
  { id: 'bonus', title: 'Bonus' },
]

function D3Page() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const demo = search.demo ?? (search.nodes ? 'force' : undefined)
  return (
    <DemoPage
      pageId="d3"
      focus={demo}
      lead={
        <>
          D3 is a toolkit rather than a chart library: scales, layouts, geo
          projections and a data join you compose into anything. Each demo lets
          D3 own the maths and the DOM inside a React ref, sizes itself with
          ResizeObserver, renders heavy scenes to canvas and tears everything
          down on unmount.
        </>
      }
      toc={TOC}
    >
      <ForceNetworkDemo
        count={search.nodes ?? 120}
        onCount={(nodes) =>
          void navigate({
            search: (prev) => ({ ...prev, nodes }),
            replace: true,
            resetScroll: false,
          })
        }
      />
      <CirclePackDemo />
      <BarRaceDemo />
      <GlobeDemo />
      <StreamgraphDemo />
      <ChordDemo />
      <PageviewsDemo />
      <VoronoiDemo />
      <D3BonusDemo />
    </DemoPage>
  )
}
