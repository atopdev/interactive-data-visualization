/** Backgrounds available in the React Bits hero switcher (also a search param). */
export const BACKGROUNDS = [
  'aurora',
  'particles',
  'silk',
  'threads',
  'waves',
  'iridescence',
  'galaxy',
] as const
export type BackgroundId = (typeof BACKGROUNDS)[number]
