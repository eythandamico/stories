const API_URL = import.meta.env.VITE_API_URL || 'https://narrative-api.winter-lake-b4eb.workers.dev'

function getToken() {
  return localStorage.getItem('admin-token')
}

export function isLoggedIn() {
  return Boolean(getToken())
}

export function logoutAdmin() {
  localStorage.removeItem('admin-token')
}

export async function loginAdmin(username, password) {
  const res = await fetch(`${API_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json()
  if (data.token) {
    localStorage.setItem('admin-token', data.token)
    return true
  }
  throw new Error(data.error || 'Login failed')
}

async function adminRequest(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token || '',
      ...options.headers,
    },
  })
  if (res.status === 401) {
    logoutAdmin()
    window.location.reload()
    throw new Error('Session expired')
  }
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(text.slice(0, 200))
  }
}

export const admin = {
  getStories: () => adminRequest('/api/stories'),
  getStory: (id) => adminRequest(`/api/stories/${id}`),
  getFeed: () => adminRequest('/api/feed'),
  saveStory: (data) => adminRequest('/api/admin/stories', { method: 'POST', body: JSON.stringify(data) }),
  saveNode: (data) => adminRequest('/api/admin/nodes', { method: 'POST', body: JSON.stringify(data) }),
  saveChoices: (storyId, nodeId, choices) => adminRequest('/api/admin/choices', {
    method: 'POST', body: JSON.stringify({ story_id: storyId, node_id: nodeId, choices }),
  }),
  setFeed: (items) => adminRequest('/api/admin/feed', { method: 'POST', body: JSON.stringify({ items }) }),
}
