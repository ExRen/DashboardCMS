import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext({
    theme: "light",
    toggleTheme: () => { }
})

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("theme")
            if (saved) return saved
            // Check system preference
            if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                return "dark"
            }
        }
        return "light"
    })

    useEffect(() => {
        const root = document.documentElement

        if (theme === "dark") {
            root.classList.add("dark")
        } else {
            root.classList.remove("dark")
        }

        localStorage.setItem("theme", theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === "light" ? "dark" : "light")
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    return useContext(ThemeContext)
}
