import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useTheme } from '../providers/ThemeProvider'
import logo from '../images/logo.svg'
import { IconDashboard, IconPackage, IconTag, IconClipboard, IconCalendar, IconImage, IconDiamond, IconSettings, IconSun, IconMoon } from '../components/Icons'

const navItems = [
  { to: '/vendor/dashboard', label: 'Dashboard', icon: IconDashboard },
  { to: '/vendor/products', label: 'Products', icon: IconPackage },
  { to: '/vendor/brands', label: 'Brands', icon: IconTag },
  { to: '/vendor/orders', label: 'Orders', icon: IconClipboard },
  { to: '/vendor/events', label: 'Events', icon: IconCalendar },
  { to: '/vendor/gallery', label: 'Gallery', icon: IconImage },
  { to: '/vendor/premium', label: 'Premium', icon: IconDiamond },
  { to: '/vendor/settings', label: 'Settings', icon: IconSettings },
]

export default function ShopLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const displayName = user?.display_name || user?.username || user?.email || 'Vendor'

  const handleLogout = async () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      {/* Sidebar */}
      <aside className="w-64 shrink-0 hidden md:flex flex-col" style={{ background: 'var(--theme-bg-secondary)', borderRight: '1px solid var(--theme-border)' }}>
        <div className="p-5">
          <Link to="/vendor/dashboard" className="flex items-center gap-2 group">
            <img src={logo} alt="Combat Shop" className="h-6 group-hover:opacity-80 transition-opacity" />
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-nike-red/10 text-nike-red font-bold shadow-sm shadow-nike-red/5'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface)]/50'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 space-y-1" style={{ borderTop: '1px solid var(--theme-border)' }}>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface)]/50 transition-all duration-300 w-full"
          >
            {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface)]/50 transition-all duration-300 w-full"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile header + sidebar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around py-2" style={{ background: 'var(--theme-bg-secondary)', borderTop: '1px solid var(--theme-border)' }}>
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] transition-all ${
                isActive ? 'text-nike-red' : 'text-[var(--theme-text-muted)]'
              }`
            }
          >
            <item.icon size={18} />
            <span className="font-bold">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
        <div className="max-w-6xl mx-auto">
          {/* Mobile top bar */}
          <div className="md:hidden flex items-center justify-between mb-6">
            <Link to="/vendor/dashboard">
              <img src={logo} alt="Combat Shop" className="h-5" />
            </Link>
            <button
              onClick={toggleTheme}
              className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] p-1 transition-colors"
            >
              {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}