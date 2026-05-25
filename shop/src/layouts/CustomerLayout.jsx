import { useState } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useCart } from '../providers/CartProvider'
import { useTheme } from '../providers/ThemeProvider'
import logo from '../images/logo.svg'

export default function CustomerLayout() {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)' }}>
      {/* Top nav */}
      <header className="sticky top-0 z-30 liquid-glass" style={{ borderBottom: '1px solid var(--theme-border)' }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link to="/shop" className="flex items-center gap-2 group">
            <img src={logo} alt="Combat Shop" className="h-6 group-hover:opacity-80 transition-opacity" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link to="/" className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text)] transition-all duration-300">
              Home
            </Link>
            <NavLink to="/shop" end className={({ isActive }) => `transition-all duration-300 tracking-wider text-xs font-bold uppercase ${isActive ? 'text-[var(--theme-text)]' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]'}`}>
              Shop
            </NavLink>
            <NavLink to="/shop/orders" className={({ isActive }) => `transition-all duration-300 tracking-wider text-xs font-bold uppercase ${isActive ? 'text-[var(--theme-text)]' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]'}`}>
              Orders
            </NavLink>
            <NavLink to="/shop/categories" className={({ isActive }) => `transition-all duration-300 tracking-wider text-xs font-bold uppercase ${isActive ? 'text-[var(--theme-text)]' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]'}`}>
              Categories
            </NavLink>
            <NavLink to="/shop/contact" className={({ isActive }) => `transition-all duration-300 tracking-wider text-xs font-bold uppercase ${isActive ? 'text-[var(--theme-text)]' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]'}`}>
              Contact
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            {/* Greeting */}
            <span className="hidden md:block text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              {user?.display_name || user?.username || user?.email ? `Sign in as ${user.display_name || user.username || user.email}` : ''}
            </span>
            {user?.role === 'vendor' && (
              <Link to="/vendor/dashboard" className="text-xs font-bold uppercase tracking-wider text-nike-red hover:text-white transition-all duration-300">
                View Profile
              </Link>
            )}
            {/* Theme toggle */}
            <button onClick={toggleTheme} className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] transition-colors duration-300 p-2" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <Link to="/shop/cart" className="relative text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] transition-colors duration-300 p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-nike-red text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scaleIn">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Mobile toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* User (desktop) */}
            <div className="hidden md:flex items-center gap-2 border-l pl-4" style={{ borderColor: 'var(--theme-border)' }}>
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-zinc-700" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-nike-red/20 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-nike-red uppercase">
                  {(user?.display_name || user?.username || user?.email || '?')[0]}
                </div>
              )}
              <span className="text-[var(--theme-text-secondary)] text-xs font-medium max-w-[120px] truncate">
                {user?.display_name || user?.username || user?.email}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t px-4 py-4 space-y-3 animate-slideUp" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-secondary)' }}>
            <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm text-[var(--theme-text)] py-1 uppercase tracking-wider font-bold text-xs">
              Home
            </Link>
            <NavLink to="/shop" end onClick={() => setMenuOpen(false)} className="block text-sm text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] py-1 uppercase tracking-wider font-bold text-xs">
              Shop
            </NavLink>
            <NavLink to="/shop/orders" onClick={() => setMenuOpen(false)} className="block text-sm text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] py-1 uppercase tracking-wider font-bold text-xs">
              Orders
            </NavLink>
            <NavLink to="/shop/categories" onClick={() => setMenuOpen(false)} className="block text-sm text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] py-1 uppercase tracking-wider font-bold text-xs">
              Categories
            </NavLink>
            <NavLink to="/shop/contact" onClick={() => setMenuOpen(false)} className="block text-sm text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] py-1 uppercase tracking-wider font-bold text-xs">
              Contact
            </NavLink>
            {user?.role === 'vendor' && (
              <Link to="/vendor/dashboard" onClick={() => setMenuOpen(false)} className="block text-sm text-[var(--theme-text-secondary)] hover:text-nike-red py-1 uppercase tracking-wider font-bold text-xs">
                Vendor Panel →
              </Link>
            )}
            <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--theme-border)' }}>
              <div className="flex items-center gap-2">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-zinc-700" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-nike-red/20 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-nike-red uppercase">
                    {(user?.display_name || user?.username || user?.email || '?')[0]}
                  </div>
                )}
                <p className="text-xs text-[var(--theme-text-muted)] truncate max-w-[200px]">{user?.display_name || user?.username || user?.email}</p>
              </div>
              <button onClick={toggleTheme} className="text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] uppercase tracking-wider font-bold">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
