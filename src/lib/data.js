import { api } from './api.js'
import { feed as localFeed } from '../data/feed.js'
import { story as localStory } from '../data/story.js'

// Cache with expiry
let feedCache = null
let feedCacheTime = 0
let storyCache = {}
const FEED_CACHE_MS = 5 * 60 * 1000 // 5 minutes

// ── Feed ──

export async function fetchFeed() {
  if (feedCache && Date.now() - feedCacheTime < FEED_CACHE_MS) return feedCache

  try {
    const rows = await api.getFeed()
    if (rows && rows.length > 0) {
      feedCacheTime = Date.now()
      feedCache = rows.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description || '',
        genre: r.genre || '',
        preview: r.preview_url,
        poster: r.poster_url,
        trending: Boolean(r.trending),
        route: r.available ? '/play' : null,
        storyId: r.id,
      }))
      return feedCache
    }
  } catch (e) {
    console.warn('API feed failed, using local:', e.message)
  }

  // Fallback to local
  feedCacheTime = Date.now()
  feedCache = localFeed
  return feedCache
}

// ── Story ──

export async function fetchStory(storyId) {
  if (storyCache[storyId]) return storyCache[storyId]

  try {
    const data = await api.getStory(storyId)
    if (data && data.nodes) {
      // Transform to match the local format
      const nodes = {}
      for (const [id, node] of Object.entries(data.nodes)) {
        nodes[id] = {
          id: node.id,
          video: node.video_url,
          poster: node.poster_url,
          title: node.title,
          description: node.description,
          ending: node.is_ending,
          endingTitle: node.ending_title,
          endingDescription: node.ending_description,
          timed: node.timed,
          timerSeconds: node.timer_seconds,
          choices: (node.choices || []).map(c => ({
            label: c.label,
            nextNodeId: c.nextNodeId,
            positive: c.positive,
            communityPct: 50, // Will be replaced by live stats
          })),
        }
      }

      const story = {
        id: data.id,
        title: data.title,
        description: data.description,
        startNodeId: data.start_node_id,
        totalEndings: data.total_endings,
        price: data.price,
        seriesPrice: data.series_price,
        nodes,
      }
      storyCache[storyId] = story
      return story
    }
  } catch (e) {
    console.warn('API story failed, using local:', e.message)
  }

  // Fallback to local
  storyCache[storyId] = localStory
  return localStory
}

// ── Choice Stats ──

export async function fetchChoiceStats(storyId, nodeId, choiceCount) {
  try {
    const stats = await api.getChoiceStats(storyId, nodeId)
    if (stats && stats.length > 0) {
      const total = stats.reduce((sum, s) => sum + s.count, 0)
      if (total === 0) return null
      const pcts = {}
      for (const s of stats) {
        pcts[s.choice_index] = Math.round((s.count / total) * 100)
      }
      return pcts
    }
  } catch {}
  return null
}

export function clearCache() {
  feedCache = null
  storyCache = {}
}
