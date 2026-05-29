import { useState, useRef, useEffect, useCallback } from 'react'

export default function ScrollProgressBar({ scrollRef, className = '' }) {
  const [progress, setProgress] = useState(0)

  const handleScroll = useCallback(() => {
    const el = scrollRef?.current
    if (!el) return
    const scrollTop = el.scrollTop
    const scrollHeight = el.scrollHeight - el.clientHeight
    setProgress(scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0)
  }, [scrollRef])

  useEffect(() => {
    const el = scrollRef?.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => el.removeEventListener('scroll', handleScroll)
  }, [scrollRef, handleScroll])

  return (
    <div className={'absolute top-0 left-0 right-0 z-10 h-0.5 pointer-events-none ' + className}>
      <div
        className="h-full bg-gradient-to-r from-nike-red via-nike-amber to-nike-orange transition-all duration-100 ease-out"
        style={{ width: progress * 100 + '%' }}
      />
    </div>
  )
}
