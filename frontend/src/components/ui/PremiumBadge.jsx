import { useGsapReveal } from '../../hooks/useGsapReveal'

export default function PremiumBadge({ size = 14, showLabel = false, animate = true }) {
  const ref = animate ? useGsapReveal() : null

  return (
    <span
      ref={ref}
      className="inline-flex items-center gap-1"
      style={animate ? { opacity: 0 } : {}}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="prem-grad" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="url(#prem-grad)"
          stroke="#fff"
          strokeWidth="1.5"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showLabel && (
        <span className="text-[10px] tracking-widest uppercase font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Premium
        </span>
      )}
    </span>
  )
}
