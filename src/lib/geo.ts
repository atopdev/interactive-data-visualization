import type {
  Feature,
  FeatureCollection,
  Geometry,
  MultiLineString,
} from 'geojson'
import { feature, mesh } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import world from 'world-atlas/countries-110m.json'

export interface CountryProps {
  name: string
}

type WorldTopology = Topology<{
  countries: GeometryCollection<CountryProps>
  land: GeometryCollection
}>

// world-atlas ships TopoJSON as plain JSON; its shape is fixed by the package.
const topology = world as unknown as WorldTopology

/** Countries (Natural Earth 1:110m) as GeoJSON, bundled via the world-atlas package. */
export const countries = feature(
  topology,
  topology.objects.countries,
) as FeatureCollection<Geometry, CountryProps>

export const land = feature(topology, topology.objects.land)

/** Shared internal borders only, for a light border stroke. */
export const borders: MultiLineString = mesh(
  topology,
  topology.objects.countries,
  (a, b) => a !== b,
)

// Natural Earth short names that differ from Our World in Data entity names.
const TO_OWID: Record<string, string> = {
  'W. Sahara': 'Western Sahara',
  'United States of America': 'United States',
  'Dem. Rep. Congo': 'Democratic Republic of Congo',
  'Dominican Rep.': 'Dominican Republic',
  'Falkland Is.': 'Falkland Islands',
  'Timor-Leste': 'East Timor',
  "Côte d'Ivoire": "Cote d'Ivoire",
  'Central African Rep.': 'Central African Republic',
  'Eq. Guinea': 'Equatorial Guinea',
  eSwatini: 'Eswatini',
  'Solomon Is.': 'Solomon Islands',
  'N. Cyprus': 'Cyprus',
  'Bosnia and Herz.': 'Bosnia and Herzegovina',
  Macedonia: 'North Macedonia',
  'S. Sudan': 'South Sudan',
}

/** Our World in Data entity name for a world-atlas country feature. */
export function owidName(f: Feature<Geometry, CountryProps>): string {
  return TO_OWID[f.properties.name] ?? f.properties.name
}
