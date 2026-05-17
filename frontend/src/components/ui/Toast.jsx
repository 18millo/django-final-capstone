import { useState, useEffect, useCallback } from 'react'

let toastId = 0
const listeners = new Set()

export function toast(msg, type = 'success', dur = 3500) {
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

  if (items.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2.5 items-end pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
          className={
            'pointer-events-auto max-w-sm px-4 py-3 rounded-2xl text-sm font-bold shadow-2xl backdrop-blur-xl border cursor-pointer animate-slideDown ' +
            (t.type === 'error' ? 'bg-nike-red/90 text-white border-nike-red/30'
            : t.type === 'info' ? 'bg-nike-dark/95 text-white border-white/10'
            : 'bg-emerald-600/90 text-white border-emerald-400/30')
          }
        >
          {t.msg}
        </div>
      ))}
    </div>
  )
}
