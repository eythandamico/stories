const API_URL = 'https://narrative-api.winter-lake-b4eb.workers.dev'
const R2_BASE = 'https://pub-2c7d56fe4c98425381098ff8d4dfabe4.r2.dev'

async function post(path, data) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': process.env.ADMIN_TOKEN || '' },
    body: JSON.stringify(data),
  })
  const text = await res.text()
  try { console.log(`${path}:`, JSON.parse(text)) } catch { console.error(`${path}: ERROR`, text.slice(0, 100)) }
}

const delay = (ms) => new Promise(r => setTimeout(r, ms))

const stories = [
  { id: 'the-last-signal', title: 'The Last Signal', description: 'A deep space crew receives a message that shouldn\'t exist.', genre: 'Sci-Fi', preview: 'preview-last-signal.mp4' },
  { id: 'room-413', title: 'Room 413', description: 'Check in. Don\'t check out.', genre: 'Horror', preview: 'preview-room-413.mp4' },
  { id: 'the-portrait', title: 'Still Life', description: 'A painter becomes obsessed with a portrait that changes overnight.', genre: 'Drama', preview: 'preview-portrait.mp4' },
  { id: 'capri-nights', title: 'Capri Nights', description: 'A summer on the Italian coast. A woman. A secret.', genre: 'Romance', preview: 'preview-capri.mp4' },
  { id: 'winter-ballet', title: 'Winter Ballet', description: 'A dancer\'s final performance. The spotlight fades.', genre: 'Drama', preview: 'feed-01.mp4' },
  { id: 'neon-nights', title: 'Neon Nights', description: 'The club is alive. Someone here knows your secret.', genre: 'Thriller', preview: 'feed-02.mp4' },
  { id: 'seoul-spring', title: 'Seoul Spring', description: 'She smiles like she knows something you don\'t.', genre: 'Romance', preview: 'feed-03.mp4', trending: true },
  { id: 'after-dark', title: 'After Dark', description: 'The cameras see everything. Tonight, you wish they didn\'t.', genre: 'Horror', preview: 'feed-04.mp4' },
  { id: 'the-descent', title: 'The Descent', description: 'Every step down takes you closer to the truth.', genre: 'Thriller', preview: 'feed-05.mp4', trending: true },
  { id: 'northern-light', title: 'Northern Light', description: 'A quiet life in the north. Until a stranger arrives.', genre: 'Drama', preview: 'feed-06.mp4' },
  { id: 'midnight-drive', title: 'Midnight Drive', description: 'The rearview mirror shows a different past.', genre: 'Sci-Fi', preview: 'feed-07.mp4' },
  { id: 'pixel-quest', title: 'Pixel Quest', description: 'She\'s not like the other NPCs. She remembers yesterday.', genre: 'Sci-Fi', preview: 'feed-08.mp4' },
  { id: 'haute-monde', title: 'Haute Monde', description: 'Behind the velvet curtain, fashion hides its darkest obsession.', genre: 'Drama', preview: 'feed-09.mp4', trending: true },
  { id: 'golden-hour', title: 'Golden Hour', description: 'The light is perfect. The choice is permanent.', genre: 'Romance', preview: 'feed-10.mp4' },
  { id: 'dungeon-scroll', title: 'Dungeon Scroll', description: 'An 8-bit adventure where death is just the beginning.', genre: 'Fantasy', preview: 'feed-11.mp4' },
  { id: 'ghost-screen', title: 'Ghost Screen', description: 'The screen flickers. A message appears. It\'s addressed to you.', genre: 'Horror', preview: 'feed-12.mp4' },
  { id: 'pink-velvet', title: 'Pink Velvet', description: 'Fame comes with a price. He\'s about to find out how much.', genre: 'Drama', preview: 'feed-13.mp4' },
  { id: 'crossing-point', title: 'Crossing Point', description: 'She waits at the same crossing every day. Today, someone waits with her.', genre: 'Romance', preview: 'feed-14.mp4' },
  { id: 'glass-empire', title: 'Glass Empire', description: 'At the top, everyone is watching. One wrong move shatters everything.', genre: 'Thriller', preview: 'feed-15.mp4' },
  { id: 'parallel-lives', title: 'Parallel Lives', description: 'Three lives. One moment. What if you could live them all?', genre: 'Sci-Fi', preview: 'feed-16.mp4' },
]

async function seed() {
  // Update existing + add missing stories
  for (let i = 0; i < stories.length; i++) {
    const s = stories[i]
    await post('/api/admin/stories', {
      id: s.id, title: s.title, description: s.description, genre: s.genre,
      preview_url: `${R2_BASE}/${s.preview}`,
      poster_url: `${R2_BASE}/posters/${s.preview.replace('.mp4', '.jpg')}`,
      trending: s.trending || false, available: false,
      sort_order: i + 1,
    })
    await delay(300)
  }

  // Set full feed order
  const feedOrder = ['romantic-adventure', ...stories.map(s => s.id)]
  await post('/api/admin/feed', { items: feedOrder })

  console.log('Done!')
}

seed().catch(console.error)
