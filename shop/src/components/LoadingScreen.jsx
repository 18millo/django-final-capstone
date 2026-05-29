import { useState, useEffect } from 'react'
import logo from '../images/logo.svg'

export default function LoadingScreen({ text = 'Loading' }) {
  const [dotCount, setDotCount] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setDotCount((c) => (c + 1) % 4), 500)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center animate-fadeIn overflow-hidden"
      style={{ background: 'var(--theme-bg)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(229,16,29,0.08) 0%, transparent 60%)',
          animation: 'pulse-glow 3s ease-in-out infinite',
        }}
      />

      <div className="animate-scaleIn relative" style={{ animationDuration: '0.6s' }}>
        <div
          className="relative rounded-3xl p-10 text-center"
          style={{
            background: 'var(--liquid-card-bg)',
            backdropFilter: 'blur(24px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
            boxShadow:
              '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px var(--liquid-border-side), inset 0 1px 0 var(--liquid-border-top)',
            animation: 'pulse-glow 2s ease-in-out infinite',
            border: '1px solid var(--theme-border)',
          }}
        >
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 30% 20%, var(--liquid-shine) 0%, transparent 60%)',
              borderRadius: 'inherit',
            }}
          />

          <div className="relative z-10">
            <img src={logo} alt="Combat Shop" className="h-8 mx-auto mb-6 opacity-80" />

            <div className="flex justify-center mb-5">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-nike-red"
                style={{
                  animation: 'boxingBob 0.8s ease-in-out infinite alternate',
                }}
              >
                <path d="M10 20h4" />
                <path d="M12 12v8" />
                <path d="M6 12h12" />
                <path d="M8 12V6a4 4 0 0 1 8 0v6" />
                <path d="M18 12V9a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v3a6 6 0 0 1-6 6h-3" />
                <path d="M6 12V9a3 3 0 0 0-3-3h0a3 3 0 0 0-3 3v3a6 6 0 0 0 6 6h3" />
              </svg>
            </div>

            <p className="text-sm font-medium tracking-wide" style={{ color: 'var(--theme-text-secondary)' }}>
              {text}
              <span className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {'.'.repeat(dotCount)}
                <span style={{ visibility: 'hidden' }}>{'.'.repeat(3 - dotCount)}</span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
