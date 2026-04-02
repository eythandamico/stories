const API_URL = import.meta.env.VITE_API_URL || 'https://narrative-api.winter-lake-b4eb.workers.dev'
const SEED_KEY = import.meta.env.VITE_SEED_KEY || 'narrative-seed-2026'

export async function adminRequest(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Seed-Key': SEED_KEY,
      ...options.headers,
    },
  })
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
