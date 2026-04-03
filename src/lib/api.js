import { auth, isFirebaseConfigured } from './firebase.js'

const API_URL = import.meta.env.VITE_API_URL || 'https://narrative-api.winter-lake-b4eb.workers.dev'

async function getToken() {
  if (!isFirebaseConfigured || !auth?.currentUser) return null
  return auth.currentUser.getIdToken()
}

async function request(path, options = {}) {
  const token = await getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (res.status === 401) {
    window.location.href = '/auth'
    throw new Error('Session expired')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

// ── Public ──
export const api = {
  getFeed: () => request('/api/feed'),
  getStories: () => request('/api/stories'),
  getStory: (id) => request(`/api/stories/${id}`),
  getChoiceStats: (storyId, nodeId) => request(`/api/stats/${storyId}/${nodeId}`),

  // ── User ──
  getMe: () => request('/api/me'),
  updateMe: (data) => request('/api/me', { method: 'PUT', body: JSON.stringify(data) }),
  recordEnding: (storyId, endingId, endingTitle) =>
    request('/api/me/endings', { method: 'POST', body: JSON.stringify({ storyId, endingId, endingTitle }) }),
  usePerk: (type) =>
    request('/api/me/perks/use', { method: 'POST', body: JSON.stringify({ type }) }),
  spendHeart: () =>
    request('/api/me/hearts/spend', { method: 'POST', body: JSON.stringify({}) }),
  recordChoice: (storyId, nodeId, choiceIndex) =>
    request('/api/stats', { method: 'POST', body: JSON.stringify({ storyId, nodeId, choiceIndex }) }),
  generateResponse: (storyId, nodeId, userText, prompt) =>
    request('/api/generate', { method: 'POST', body: JSON.stringify({ storyId, nodeId, userText, prompt }) }),

  // ── Admin ──
  createStory: (story) =>
    request('/api/admin/stories', { method: 'POST', body: JSON.stringify(story) }),
  createNode: (node) =>
    request('/api/admin/nodes', { method: 'POST', body: JSON.stringify(node) }),
  createChoices: (storyId, nodeId, choices) =>
    request('/api/admin/choices', { method: 'POST', body: JSON.stringify({ story_id: storyId, node_id: nodeId, choices }) }),
  setFeed: (items) =>
    request('/api/admin/feed', { method: 'POST', body: JSON.stringify({ items }) }),
}
