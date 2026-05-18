const API_BASE = 'http://localhost:8000'

export function mediaUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  if (path.startsWith('/')) return `${API_BASE}${path}`
  return `${API_BASE}/media/${path}`
}
