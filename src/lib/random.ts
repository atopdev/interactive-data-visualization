// Dependency-free deterministic randomness, safe to import from light chunks
// (the landing page) without pulling in Faker.

/** Stable 32-bit FNV-1a hash so string keys map to deterministic seeds. */
export function hashSeed(key: string | number): number {
  const str = String(key)
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Seeded PRNG (mulberry32) for animation jitter that must be reproducible. */
export function seededRandom(key: string | number): () => number {
  let a = hashSeed(key) || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
