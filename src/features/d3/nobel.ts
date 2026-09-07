/** Nobel prize categories in a fixed order (fixes their palette slot). */
export const CATEGORIES = [
  'Physics',
  'Chemistry',
  'Physiology or Medicine',
  'Literature',
  'Peace',
  'Economic Sciences',
] as const

export const categoryIndex = (category: string) =>
  Math.max(0, (CATEGORIES as readonly string[]).indexOf(category))
