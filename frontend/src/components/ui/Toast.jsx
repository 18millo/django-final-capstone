import { useState, useEffect, useCallback } from 'react'

let toastId = 0
const listeners = new Set()

export function toast(msg, type = 'success', dur = 2500) {
  const id = ++toastId
  listeners.forEach((fn) => fn({ id, msg, type, dur }))
  return id
}

export default function ToastContainer() {
  const [items, setItems] = useState([])

  const add = useCallback((t) => {
    setItems((prev) => [...prev, t])
    setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), t.dur)
  }, [])

  useEffect(() => {
    listeners.add(add)
    return () => listeners.delete(add)
  }, [add])

  const remove = (id) => setItems((prev) => prev.filter((x) => x.id !== id))

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          className={'pointer-events-auto px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl backdrop-blur-md border cursor-pointer animate-floatUp ' + (
            t.type === 'error' ? 'bg-nike-red/90 text-white border-nike-red/30'
            : 'bg-nike-dark/95 text-white border-white/10'
          )}
        >
          {t.msg}
        </div>
      ))}
    </div>
  )
}
