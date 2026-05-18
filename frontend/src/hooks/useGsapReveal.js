import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'

export function useGsapReveal({ threshold = 0.05, rootMargin = '0px 0px -40px 0px' } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    gsap.set(el, { opacity: 0, y: 40 })
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
          observer.unobserve(el)
        }
      },
      { threshold, rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return ref
}

export function useGsapStagger({ threshold = 0.05, rootMargin = '0px 0px -40px 0px', stagger = 0.08 } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const children = el.children
    if (!children.length) return
    gsap.set(children, { opacity: 0, y: 30 })
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(children, {
            opacity: 1, y: 0, duration: 0.6, stagger,
            ease: 'power2.out'
          })
          observer.unobserve(el)
        }
      },
      { threshold, rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, stagger])

  return ref
}

export function useCountUp({ end, duration = 2, delay = 0, threshold = 0.5 } = {}) {
  const ref = useRef(null)

  const animate = useCallback(() => {
    if (!ref.current) return
    const obj = { val: 0 }
    gsap.to(obj, {
      val: end,
      duration,
      delay,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) ref.current.textContent = Math.round(obj.val).toLocaleString()
      },
    })
  }, [end, duration, delay])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate()
          observer.unobserve(el)
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [animate, threshold])

  return ref
}

export function useGsapParallax({ speed = 0.3 } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      const center = rect.top + rect.height / 2
      const viewCenter = window.innerHeight / 2
      const offset = (center - viewCenter) * speed
      gsap.set(el, { y: offset })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [speed])

  return ref
}
