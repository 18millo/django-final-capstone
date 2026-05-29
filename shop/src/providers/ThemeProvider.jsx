import { createContext, useContext, useState, useEffect } from 'react'

const FONT_MAP = {
  Inter: "'Inter', sans-serif",
  Roboto: "'Roboto', sans-serif",
  Playfair: "'Playfair Display', serif",
  Mono: "'JetBrains Mono', monospace",
  System: "system-ui, -apple-system, sans-serif",
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('shop_theme') || 'dark')

  useEffect(() => {
    localStorage.setItem('shop_theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const font = getCookie('app_font') || 'Inter'
    const family = FONT_MAP[font] || FONT_MAP.Inter
    document.documentElement.style.setProperty('--app-font', family)
    document.documentElement.style.fontFamily = family
  }, [])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
