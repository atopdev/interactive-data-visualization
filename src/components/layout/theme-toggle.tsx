import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'

/**
 * Switches between light and dark. Until the first click the theme follows
 * the system preference (or the choice saved on a previous visit); a click
 * saves the opposite of what is currently shown.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const next = resolvedTheme === 'dark' ? 'light' : 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={() => setTheme(next)}
      className="relative overflow-hidden"
    >
      <Sun className="scale-100 rotate-0 transition-transform duration-500 ease-out motion-reduce:transition-none dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute scale-0 rotate-90 transition-transform duration-500 ease-out motion-reduce:transition-none dark:scale-100 dark:rotate-0" />
    </Button>
  )
}
