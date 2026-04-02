// Run: node api/seed.js
// Seeds the D1 database with the initial story and feed data via the API

const API_URL = 'https://narrative-api.winter-lake-b4eb.workers.dev'

// Use a test token — for seeding, we'll call admin endpoints directly
// In production, you'd use a Firebase admin token
async function post(path, data) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Seed-Key': 'narrative-seed-2026' },
    body: JSON.stringify(data),
  })
  const text = await res.text()
  try {
    const json = JSON.parse(text)
    console.log(`${path}:`, json)
    return json
  } catch {
    console.error(`${path}: ERROR`, res.status, text.slice(0, 200))
    return { error: text.slice(0, 200) }
  }
}

const VIDEO_BASE = 'https://pub-2c7d56fe4c98425381098ff8d4dfabe4.r2.dev'

// Story: The Missed Train
const story = {
  id: 'romantic-adventure',
  title: 'The Missed Train',
  description: 'A chance encounter at a rainy station. Every choice shapes what comes next.',
  genre: 'Romance',
  cover_url: `${VIDEO_BASE}/scene01.mp4`,
  preview_url: `${VIDEO_BASE}/scene01.mp4`,
  poster_url: `${VIDEO_BASE}/posters/scene01.jpg`,
  trending: true,
  available: true,
  price: 0,
  series_price: 4.99,
  total_endings: 2,
  start_node_id: 'scene01',
  sort_order: 0,
}

const nodes = [
  { id: 'scene01', title: 'The Encounter', description: 'Leo misses his train and steps under a small shelter. Maya is already there, shaking rain from her coat.', video_url: `${VIDEO_BASE}/scene01.mp4`, poster_url: `${VIDEO_BASE}/posters/scene01.jpg`, choices: [{ label: 'Talk to her', nextNodeId: 'scene02', positive: true }, { label: 'Stay quiet', nextNodeId: 'scene03' }] },
  { id: 'scene02', title: 'First Words', description: 'Leo comments on the rain; Maya smiles, amused.', video_url: `${VIDEO_BASE}/scene02.mp4`, poster_url: `${VIDEO_BASE}/posters/scene02.jpg`, timed: true, timer_seconds: 12, choices: [{ label: 'Ask about her life', nextNodeId: 'scene04', positive: true }, { label: 'Make a joke', nextNodeId: 'scene05' }] },
  { id: 'scene03', title: 'Silent Connection', description: 'They stand in silence as rain echoes on metal.', video_url: `${VIDEO_BASE}/scene03.mp4`, poster_url: `${VIDEO_BASE}/posters/scene03.jpg`, choices: [{ label: 'Break the silence', nextNodeId: 'scene02', positive: true }, { label: 'Let the moment pass', nextNodeId: 'scene06' }] },
  { id: 'scene04', title: 'Opening Up', description: 'Maya shares she just moved here, starting over.', video_url: `${VIDEO_BASE}/scene04.mp4`, poster_url: `${VIDEO_BASE}/posters/scene04.jpg`, timed: true, timer_seconds: 10, choices: [{ label: 'Share something personal', nextNodeId: 'scene07', positive: true }, { label: 'Keep it light', nextNodeId: 'scene05' }] },
  { id: 'scene05', title: 'The Joke', description: 'Leo makes a terrible joke about missed trains.', video_url: `${VIDEO_BASE}/scene05.mp4`, poster_url: `${VIDEO_BASE}/posters/scene05.jpg`, timed: true, timer_seconds: 8, choices: [{ label: 'Board the train together', nextNodeId: 'scene08', positive: true }, { label: 'Skip it, go for coffee', nextNodeId: 'scene09', positive: true }] },
  { id: 'scene06', title: 'Missed Chance', description: 'They board the same train, but sit apart.', video_url: `${VIDEO_BASE}/scene06.mp4`, poster_url: `${VIDEO_BASE}/posters/scene06.jpg`, choices: [{ label: 'Regret and return later', nextNodeId: 'scene10', positive: true }, { label: 'Let it go', nextNodeId: 'scene11' }] },
  { id: 'scene07', title: 'Vulnerability', description: 'Leo shares a story he never tells anyone.', video_url: `${VIDEO_BASE}/scene07.mp4`, poster_url: `${VIDEO_BASE}/posters/scene07.jpg`, timed: true, timer_seconds: 10, choices: [{ label: 'Ask to see her again', nextNodeId: 'scene12', positive: true }, { label: 'Stay in the moment', nextNodeId: 'scene09' }] },
  { id: 'scene08', title: 'Shared Ride', description: 'They sit together as the train moves through the city.', video_url: `${VIDEO_BASE}/scene08.mp4`, poster_url: `${VIDEO_BASE}/posters/scene08.jpg`, timed: true, timer_seconds: 8, choices: [{ label: 'Ask for her number', nextNodeId: 'scene12', positive: true }, { label: 'Let the moment stay unspoken', nextNodeId: 'scene11' }] },
  { id: 'scene09', title: 'Coffee Shop', description: 'They let the train go and walk to a nearby café.', video_url: `${VIDEO_BASE}/scene09.mp4`, poster_url: `${VIDEO_BASE}/posters/scene09.jpg`, choices: [{ label: 'Walk together afterward', nextNodeId: 'scene12', positive: true }, { label: 'Say goodbye at the café', nextNodeId: 'scene11' }] },
  { id: 'scene10', title: 'Second Chance', description: 'Leo returns to the station days later.', video_url: `${VIDEO_BASE}/scene10.mp4`, poster_url: `${VIDEO_BASE}/posters/scene10.jpg`, choices: [{ label: 'Start again', nextNodeId: 'scene02', positive: true }] },
  { id: 'scene11', title: 'What If', description: 'They continue their lives in separate directions.', video_url: `${VIDEO_BASE}/scene11.mp4`, poster_url: `${VIDEO_BASE}/posters/scene11.jpg`, is_ending: true, ending_title: 'What If', ending_description: 'Some stories remain unfinished. But the memory of that rainy night lingers.' },
  { id: 'scene12', title: 'Beginning', description: 'They choose to continue, beyond that night.', video_url: `${VIDEO_BASE}/scene12.mp4`, poster_url: `${VIDEO_BASE}/posters/scene12.jpg`, is_ending: true, ending_title: 'A New Beginning', ending_description: 'The missed train became the start of their story.' },
]

// Feed items (preview videos for the home feed)
const feedStories = [
  { id: 'romantic-adventure', title: 'The Missed Train', genre: 'Romance', preview: 'scene01.mp4', trending: true, available: true },
  { id: 'the-last-signal', title: 'The Last Signal', genre: 'Sci-Fi', preview: 'preview-last-signal.mp4' },
  { id: 'room-413', title: 'Room 413', genre: 'Horror', preview: 'preview-room-413.mp4' },
  { id: 'the-portrait', title: 'Still Life', genre: 'Drama', preview: 'preview-portrait.mp4' },
  { id: 'capri-nights', title: 'Capri Nights', genre: 'Romance', preview: 'preview-capri.mp4' },
  { id: 'winter-ballet', title: 'Winter Ballet', genre: 'Drama', preview: 'feed-01.mp4' },
  { id: 'neon-nights', title: 'Neon Nights', genre: 'Thriller', preview: 'feed-02.mp4' },
  { id: 'seoul-spring', title: 'Seoul Spring', genre: 'Romance', preview: 'feed-03.mp4', trending: true },
  { id: 'after-dark', title: 'After Dark', genre: 'Horror', preview: 'feed-04.mp4' },
  { id: 'the-descent', title: 'The Descent', genre: 'Thriller', preview: 'feed-05.mp4', trending: true },
]

const delay = (ms) => new Promise(r => setTimeout(r, ms))

async function seed() {
  console.log('Seeding story...')
  await post('/api/admin/stories', story)

  console.log('Seeding nodes...')
  for (const node of nodes) {
    const { choices, ...nodeData } = node
    await post('/api/admin/nodes', { ...nodeData, story_id: 'romantic-adventure' })
    await delay(300)
    if (choices) {
      await post('/api/admin/choices', { story_id: 'romantic-adventure', node_id: node.id, choices })
      await delay(300)
    }
  }

  // Create placeholder stories for feed
  console.log('Seeding feed stories...')
  for (let i = 0; i < feedStories.length; i++) {
    const f = feedStories[i]
    await post('/api/admin/stories', {
      id: f.id,
      title: f.title,
      description: '',
      genre: f.genre,
      preview_url: `${VIDEO_BASE}/${f.preview}`,
      poster_url: `${VIDEO_BASE}/posters/${f.preview.replace('.mp4', '.jpg')}`,
      trending: f.trending || false,
      available: f.available || false,
      sort_order: i,
    })
    await delay(300)
  }

  console.log('Setting feed order...')
  await post('/api/admin/feed', { items: feedStories.map(f => f.id) })

  console.log('Done!')
}

seed().catch(console.error)
