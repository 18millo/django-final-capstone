import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

export default function Reveal({ children, className = '', delay = 0, direction = 'up', gsap: useGsap = false }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (useGsap) {
      gsap.set(el, { opacity: 0, y: direction === 'up' ? 40 : direction === 'down' ? -40 : direction === 'left' ? -30 : direction === 'right' ? 30 : 0, scale: direction === 'scale' ? 0.95 : 1 })
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            gsap.to(el, {
              opacity: 1, y: 0, x: 0, scale: 1,
              duration: 0.8, delay: delay / 1000,
              ease: 'power3.out',
            })
            observer.unobserve(el)
          }
        },
        { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
      )
      observer.observe(el)
      return () => observer.disconnect()
    }

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
  }, [delay, direction, useGsap])

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
      className={(useGsap ? '' : 'transition-all duration-700 ease-out ' + (visible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : 'opacity-0 ' + (dirClass[direction] || dirClass.up))) + ' ' + className}
    >
      {children}
    </div>
  )
}
