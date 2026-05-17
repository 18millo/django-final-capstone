const API_BASE = 'http://localhost:8000'

export function mediaUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}
