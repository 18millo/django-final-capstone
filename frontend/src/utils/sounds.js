let ctx = null

function getCtx() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  } catch {}
  return ctx
}

function sine(c, freq, dur, vol) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.connect(g)
  g.connect(c.destination)
  o.type = 'sine'
  o.frequency.setValueAtTime(freq, c.currentTime)
  g.gain.setValueAtTime(vol, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)
  o.start(c.currentTime)
  o.stop(c.currentTime + dur)
}

function noise(c, dur, vol, lpFreq) {
  const len = c.sampleRate * dur
  const b = c.createBuffer(1, len, c.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) {
    d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  }
  const s = c.createBufferSource()
  const g = c.createGain()
  const f = c.createBiquadFilter()
  s.buffer = b
  f.type = 'lowpass'
  f.frequency.setValueAtTime(lpFreq || 3000, c.currentTime)
  g.gain.setValueAtTime(vol, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)
  s.connect(f)
  f.connect(g)
  g.connect(c.destination)
  s.start(c.currentTime)
  s.stop(c.currentTime + dur)
}

export function playClick() {
  try {
    const c = getCtx()
    sine(c, 1200, 0.04, 0.08)
    setTimeout(() => sine(c, 900, 0.03, 0.04), 20)
  } catch {}
}

export function playHover() {
  try {
    const c = getCtx()
    sine(c, 1500, 0.03, 0.03)
  } catch {}
}

export function playWhoosh() {
  try {
    noise(getCtx(), 0.12, 0.04, 2000)
  } catch {}
}

export function playBell() {
  try {
    const c = getCtx()
    sine(c, 880, 0.8, 0.12)
    setTimeout(() => sine(c, 1100, 0.5, 0.06), 60)
    setTimeout(() => sine(c, 660, 0.6, 0.05), 120)
  } catch {}
}

export function playSuccess() {
  try {
    const c = getCtx()
    sine(c, 1047, 0.1, 0.1)
    setTimeout(() => sine(c, 1319, 0.1, 0.1), 80)
    setTimeout(() => sine(c, 1568, 0.15, 0.1), 160)
  } catch {}
}

export function playError() {
  try {
    const c = getCtx()
    sine(c, 300, 0.15, 0.08)
    setTimeout(() => sine(c, 200, 0.2, 0.08), 100)
  } catch {}
}
