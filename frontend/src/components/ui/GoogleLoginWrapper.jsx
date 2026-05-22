import { useState, useEffect, useRef } from 'react'
import { GoogleLogin } from '@react-oauth/google'

export default function GoogleLoginWrapper(props) {
  const [ready, setReady] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    const t = setTimeout(() => setReady(true), 0)
    return () => clearTimeout(t)
  }, [])

  if (!ready) return <div className="h-10" />
  return <GoogleLogin {...props} />
}
