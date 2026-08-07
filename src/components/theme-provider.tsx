import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  readStoredTheme,
  storeTheme,
  ThemeContext,
  type ResolvedTheme,
  type Theme,
} from '@/lib/theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function subscribeSystem(onChange: () => void) {
  const mql = window.matchMedia(DARK_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const systemPrefersDark = () => window.matchMedia(DARK_QUERY).matches

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  const prefersDark = useSyncExternalStore(subscribeSystem, systemPrefersDark, () => true)
  const resolvedTheme: ResolvedTheme =
    theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  const setTheme = useCallback((next: Theme) => {
    storeTheme(next)
    setThemeState(next)
  }, [])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  )
  return <ThemeContext value={value}>{children}</ThemeContext>
}
