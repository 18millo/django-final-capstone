import { useEffect, useRef, useState } from 'react'

export default function Reveal({ children, className = '', delay = 0, direction = 'up' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let timer = null
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => setVisible(true), delay)
        } else {
          setVisible(false)
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [delay])

  const dirClass = {
    up: 'translate-y-10',
    down: '-translate-y-10',
    left: '-translate-x-10',
    right: 'translate-x-10',
    fade: '',
    scale: 'scale-95',
  }

  return (
    <div
      ref={ref}
      className={'transition-all duration-700 ease-out ' + (visible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : 'opacity-0 ' + (dirClass[direction] || dirClass.up)) + ' ' + className}
    >
      {children}
    </div>
  )
}
