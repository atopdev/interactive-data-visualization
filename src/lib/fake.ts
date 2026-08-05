import { faker } from '@faker-js/faker/locale/en'

/**
 * Global seed for all generated content. Every Faker call in the app goes
 * through this module so names, labels and alt text are identical on every
 * load.
 */
export const FAKER_SEED = 20_260_923

faker.seed(FAKER_SEED)

export { faker }

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

/**
 * Generate content from a namespaced seed. Re-seeding per call makes the
 * output independent of call order (and therefore of navigation order), so a
 * demo renders the same data no matter which page the visitor opened first.
 *
 * @example const people = fakeWith('gsap-cards', (f) => f.helpers.multiple(() => f.person.fullName(), { count: 6 }))
 */
export function fakeWith<T>(key: string, generate: (f: typeof faker) => T): T {
  faker.seed(FAKER_SEED + hashSeed(key))
  const result = generate(faker)
  faker.seed(FAKER_SEED)
  return result
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

export interface FakeProfile {
  id: string
  name: string
  firstName: string
  jobTitle: string
  company: string
  city: string
  bio: string
  avatarSeed: string
}

export function fakeProfiles(key: string, count: number): FakeProfile[] {
  return fakeWith(key, (f) =>
    Array.from({ length: count }, (_, i) => {
      const firstName = f.person.firstName()
      const lastName = f.person.lastName()
      return {
        id: `${key}-${i}`,
        name: `${firstName} ${lastName}`,
        firstName,
        jobTitle: f.person.jobTitle(),
        company: f.company.name(),
        city: f.location.city(),
        bio: f.person.bio(),
        avatarSeed: `${key}-${f.string.alphanumeric(8)}`,
      }
    }),
  )
}

export interface FakeNotification {
  id: string
  title: string
  body: string
  author: string
  time: string
}

export function fakeNotifications(key: string, count: number): FakeNotification[] {
  return fakeWith(key, (f) =>
    Array.from({ length: count }, (_, i) => ({
      id: `${key}-${i}`,
      title: f.hacker.phrase().replace(/^./, (c) => c.toUpperCase()),
      body: f.company.catchPhrase(),
      author: f.person.fullName(),
      time: `${f.number.int({ min: 1, max: 59 })}m ago`,
    })),
  )
}
