import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '../providers/ThemeProvider'

export default function AuthLayout({ children }) {
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === 'light'
  const location = useLocation()
  return (
    <div className={'min-h-screen flex flex-col ' + (isLight ? 'bg-[#f1f5f9]' : 'bg-nike-black')}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-nike-red via-nike-amber to-nike-orange" />
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleTheme}
          className={'p-2 rounded-xl transition-all duration-200 ' + (isLight ? 'hover:bg-nike-gray/30 text-nike-light' : 'hover:bg-white/10 text-white/40')}
          title={isLight ? 'Dark mode' : 'Light mode'}
        >
          {isLight ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          )}
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-nike-red rounded-full flex items-center justify-center font-black text-sm tracking-widest">
                C
              </div>
              <span className={'font-black text-2xl tracking-widest uppercase ' + (isLight ? 'text-nike-black' : 'text-white')}>CombatHub</span>
            </Link>
          </div>
          <div className={'rounded-2xl p-8 ' + (isLight ? 'bg-nike-dark border border-nike-gray shadow-sm' : 'bg-nike-dark border border-white/10')}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
          <p className={'text-center mt-6 text-xs tracking-wider uppercase ' + (isLight ? 'text-nike-light' : 'text-white/20')}>
            Forged in the gym
          </p>
        </div>
      </div>
    </div>
  )
}
