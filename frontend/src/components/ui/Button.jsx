import Spinner from './Spinner'
import { playClick } from '../../utils/sounds'

export default function Button({ children, variant = 'primary', loading, className = '', ...props }) {
  const base = 'px-6 py-3 rounded-full text-sm tracking-widest uppercase font-bold transition-all duration-300 inline-flex items-center justify-center gap-2 disabled:opacity-50'
  const variants = {
    primary: 'bg-nike-red hover:bg-white hover:text-nike-black text-white',
    outline: 'border border-white/20 hover:border-white/60 text-white/60 hover:text-white',
    danger: 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/50',
    light: 'bg-white text-nike-black hover:bg-nike-red hover:text-white',
  }
  return (
    <button
      className={base + ' ' + variants[variant] + ' ' + className}
      disabled={loading || props.disabled}
      onClick={(e) => { if (!loading) { try { playClick() } catch {} }; props.onClick?.(e) }}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
