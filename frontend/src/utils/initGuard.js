export function patchGoogleInitialize() {
  const interval = setInterval(() => {
    const gsi = window.google?.accounts?.id
    if (!gsi || typeof gsi.initialize !== 'function') return
    clearInterval(interval)
    const originalInit = gsi.initialize.bind(gsi)
    let called = false
    gsi.initialize = function (config) {
      if (called) return
      called = true
      originalInit(config)
    }
  }, 5)
}
