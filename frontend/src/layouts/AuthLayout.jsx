import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '../providers/ThemeProvider'

export default function AuthLayout({ children }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const location = useLocation()
  return (
    <div className={'min-h-screen flex flex-col ' + (isLight ? 'bg-white' : 'bg-nike-black')}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-nike-red via-nike-amber to-nike-orange" />
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
