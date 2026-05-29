import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const APP_VERSION = '1.0.0'
const FONTS = [
  { value: 'Inter', label: 'Inter', family: "'Inter', sans-serif" },
  { value: 'Roboto', label: 'Roboto', family: "'Roboto', sans-serif" },
  { value: 'Playfair', label: 'Playfair Display', family: "'Playfair Display', serif" },
  { value: 'Mono', label: 'JetBrains Mono', family: "'JetBrains Mono', monospace" },
  { value: 'System', label: 'System UI', family: "system-ui, -apple-system, sans-serif" },
]

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name, value, days = 365) {
  document.cookie = name + '=' + encodeURIComponent(value) + ';domain=localhost;path=/;max-age=' + (days * 86400)
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('combathub-theme') || 'dark'
  })
  const [font, setFont] = useState(() => {
    return getCookie('app_font') || localStorage.getItem('app_font') || 'Inter'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('combathub-theme', theme)
  }, [theme])

  useEffect(() => {
    const chosen = FONTS.find((f) => f.value === font) || FONTS[0]
    document.documentElement.style.setProperty('--app-font', chosen.family)
    document.documentElement.style.fontFamily = chosen.family
    localStorage.setItem('app_font', font)
    setCookie('app_font', font)
  }, [font])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  const changeFont = useCallback((f) => setFont(f), [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, font, changeFont, fonts: FONTS, appVersion: APP_VERSION }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
