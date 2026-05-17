const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899']

export function burstConfetti(count = 40) {
  const body = document.body
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div')
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    const size = 6 + Math.random() * 6
    const x = Math.random() * 100
    const dur = 800 + Math.random() * 1200
    const rotate = Math.random() * 720

    el.style.cssText = `
      position: fixed; top: 50%; left: ${x}%; z-index: 9999;
      width: ${size}px; height: ${size * (0.4 + Math.random() * 0.4)}px;
      background: ${color}; border-radius: 2px;
      pointer-events: none;
      animation: confettiFall ${dur}ms ease-out forwards;
      --tx: ${(Math.random() - 0.5) * 200}px;
      --ty: ${-200 - Math.random() * 400}px;
      --r: ${rotate}deg;
    `
    body.appendChild(el)
    setTimeout(() => el.remove(), dur)
  }
}

if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes confettiFall {
      0% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
      100% { opacity: 0; transform: translate(var(--tx), var(--ty)) rotate(var(--r)); }
    }
  `
  document.head.appendChild(style)
}
