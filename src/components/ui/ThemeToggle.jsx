import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/context/ThemeContext"
import { useEffect } from "react"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  // Keyboard shortcut: Ctrl+Shift+D to toggle theme
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        toggleTheme()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleTheme])

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2.5 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 transition-all duration-300 hover:scale-105 group"
      title={`${theme === 'dark' ? 'Light Mode' : 'Dark Mode'} (Ctrl+Shift+D)`}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon */}
        <Sun
          className={`absolute inset-0 h-5 w-5 text-yellow-500 transition-all duration-500 ${theme === 'dark'
              ? 'rotate-0 scale-100 opacity-100'
              : 'rotate-90 scale-0 opacity-0'
            }`}
        />
        {/* Moon Icon */}
        <Moon
          className={`absolute inset-0 h-5 w-5 text-slate-600 dark:text-slate-400 transition-all duration-500 ${theme === 'dark'
              ? '-rotate-90 scale-0 opacity-0'
              : 'rotate-0 scale-100 opacity-100'
            }`}
        />
      </div>
      {/* Shortcut hint on hover */}
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Ctrl+Shift+D
      </span>
    </button>
  )
}
