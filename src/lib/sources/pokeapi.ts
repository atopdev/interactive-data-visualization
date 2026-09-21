import { z } from 'zod'
import { fetchJson, type FetchOptions } from '../fetchers'

const POKEMON = [
  'pikachu',
  'charizard',
  'blastoise',
  'venusaur',
  'gengar',
  'snorlax',
  'dragonite',
  'mewtwo',
  'lucario',
  'gyarados',
] as const

const pokemonResponse = z.object({
  id: z.number(),
  name: z.string(),
  height: z.number(),
  weight: z.number(),
  types: z.array(z.object({ type: z.object({ name: z.string() }) })),
  stats: z.array(
    z.object({ base_stat: z.number(), stat: z.object({ name: z.string() }) }),
  ),
})

export const STAT_KEYS = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
] as const

const pokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
  height: z.number(),
  weight: z.number(),
  types: z.array(z.string()),
  stats: z.object({
    hp: z.number(),
    attack: z.number(),
    defense: z.number(),
    'special-attack': z.number(),
    'special-defense': z.number(),
    speed: z.number(),
  }),
})
export type Pokemon = z.infer<typeof pokemonSchema>
export const pokemonListSchema = z.object({ pokemon: z.array(pokemonSchema) })
export type PokemonList = z.infer<typeof pokemonListSchema>

export async function fetchPokemon(
  options?: FetchOptions,
): Promise<PokemonList> {
  const list = await Promise.all(
    POKEMON.map((name) =>
      fetchJson(
        `https://pokeapi.co/api/v2/pokemon/${name}`,
        pokemonResponse,
        options,
      ),
    ),
  )
  return pokemonListSchema.parse({
    pokemon: list.map((p) => ({
      id: p.id,
      name: p.name,
      height: p.height,
      weight: p.weight,
      types: p.types.map((t) => t.type.name),
      stats: Object.fromEntries(p.stats.map((s) => [s.stat.name, s.base_stat])),
    })),
  })
}
