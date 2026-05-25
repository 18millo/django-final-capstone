import { Link } from 'react-router-dom'
import logo from '../images/logo.svg'

export default function AccessGate() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--theme-bg)' }}>
      <div className="max-w-md w-full text-center">
        <img src={logo} alt="Combat Shop" className="h-8 mx-auto mb-8 opacity-80" />

        <h1 className="text-2xl font-black tracking-tight mb-4" style={{ color: 'var(--theme-text)' }}>
          Login Required
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--theme-text-secondary)' }}>
          You need to log in to access the shop.
        </p>

        <div className="space-y-6">
          <div className="liquid-glass-card rounded-2xl p-6 border" style={{ borderColor: 'var(--theme-border)' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
              Vendors, click continue to log in and manage your shop.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-nike-red hover:bg-white hover:text-nike-black text-white px-8 py-3 rounded-full text-sm font-bold tracking-wider transition-all duration-300 mt-4"
            >
              Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          <div className="liquid-glass-card rounded-2xl p-6 border" style={{ borderColor: 'var(--theme-border)' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
              Athletes, please log in through the CombatHub app to access the shop.
            </p>
          </div>

          <Link to="/" className="block text-xs uppercase tracking-widest font-bold transition-colors" style={{ color: 'var(--theme-text-muted)' }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
