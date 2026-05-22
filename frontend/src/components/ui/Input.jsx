import { useState } from 'react'
import { useTheme } from '../../providers/ThemeProvider'

export default function Input({ label, error, className = '', type, ...props }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && show ? 'text' : type
  const { theme } = useTheme()
  const isLight = theme === 'light'

  return (
    <div className="space-y-1.5">
      {label && <label className={'block text-xs tracking-widest uppercase font-bold ' + (isLight ? 'text-nike-black/60' : 'text-white/40')}>{label}</label>}
      <div className="relative">
        <input
          type={inputType}
          className={`w-full border ${
            error ? 'border-nike-red' : (isLight ? 'border-nike-gray' : 'border-white/10')
          } rounded-xl px-4 py-3 pr-11 transition-all duration-300 focus:outline-none ${isLight ? 'bg-white text-nike-black placeholder:text-nike-light/50 focus:border-nike-black/30 focus:bg-nike-gray/20' : 'bg-white/5 text-white placeholder:text-white/20 focus:border-white/40 focus:bg-white/10'} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className={'absolute right-3 top-1/2 -translate-y-1/2 transition-colors ' + (isLight ? 'text-nike-light hover:text-nike-black' : 'text-white/30 hover:text-white/70')}
          >
            {show ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-nike-red mt-1">{error}</p>}
    </div>
  )
}
