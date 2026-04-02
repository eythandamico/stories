import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stack } from '../components/stack.jsx'
import { Surface } from '../components/surface.jsx'
import { Row } from '../components/row.jsx'
import Icon from '../lib/icon.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'https://narrative-api.winter-lake-b4eb.workers.dev'
const SEED_KEY = 'narrative-seed-2026'
const R2_BASE = 'https://pub-2c7d56fe4c98425381098ff8d4dfabe4.r2.dev'

async function adminPost(path, data) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Seed-Key': SEED_KEY },
    body: JSON.stringify(data),
  })
  return res.json()
}

function StoryForm({ onSave }) {
  const [story, setStory] = useState({
    id: '', title: '', description: '', genre: 'Romance',
    trending: false, available: false, price: 0, seriesPrice: 4.99,
    totalEndings: 2, previewVideo: '', startNodeId: '',
  })

  const genres = ['Romance', 'Thriller', 'Sci-Fi', 'Horror', 'Drama', 'Fantasy', 'Comedy']

  const handleSave = async () => {
    if (!story.id || !story.title) return alert('ID and title required')
    const slug = story.id || story.title.toLowerCase().replace(/\s+/g, '-')
    await adminPost('/api/admin/stories', {
      id: slug,
      title: story.title,
      description: story.description,
      genre: story.genre,
      preview_url: story.previewVideo || `${R2_BASE}/${slug}.mp4`,
      poster_url: `${R2_BASE}/posters/${slug}.jpg`,
      trending: story.trending,
      available: story.available,
      price: story.price,
      series_price: story.seriesPrice,
      total_endings: story.totalEndings,
      start_node_id: story.startNodeId,
      sort_order: 0,
    })
    onSave?.(slug)
  }

  return (
    <Surface padding="md" elevation="sm">
      <Stack gap="sm">
        <h3 className="inv-heading">Story Details</h3>
        <input placeholder="Story ID (slug)" value={story.id} onChange={e => setStory({ ...story, id: e.target.value })}
          className="w-full h-10 px-3 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none" />
        <input placeholder="Title" value={story.title} onChange={e => setStory({ ...story, title: e.target.value })}
          className="w-full h-10 px-3 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none" />
        <textarea placeholder="Description" value={story.description} onChange={e => setStory({ ...story, description: e.target.value })}
          className="w-full h-20 px-3 py-2 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none resize-none" />
        <select value={story.genre} onChange={e => setStory({ ...story, genre: e.target.value })}
          className="w-full h-10 px-3 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none">
          {genres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <input placeholder="Preview video URL" value={story.previewVideo} onChange={e => setStory({ ...story, previewVideo: e.target.value })}
          className="w-full h-10 px-3 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none" />
        <input placeholder="Start node ID (e.g. scene01)" value={story.startNodeId} onChange={e => setStory({ ...story, startNodeId: e.target.value })}
          className="w-full h-10 px-3 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none" />
        <Row gap="md">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={story.available} onChange={e => setStory({ ...story, available: e.target.checked })} />
            <span className="text-[16px] text-[var(--inv-heading)]">Available</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={story.trending} onChange={e => setStory({ ...story, trending: e.target.checked })} />
            <span className="text-[16px] text-[var(--inv-heading)]">Trending</span>
          </label>
        </Row>
        <Row gap="sm">
          <div className="flex-1">
            <label className="text-[14px] text-[var(--inv-muted)]">Total endings</label>
            <input type="number" value={story.totalEndings} onChange={e => setStory({ ...story, totalEndings: parseInt(e.target.value) || 0 })}
              className="w-full h-10 px-3 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none" />
          </div>
          <div className="flex-1">
            <label className="text-[14px] text-[var(--inv-muted)]">Price ($)</label>
            <input type="number" step="0.01" value={story.price} onChange={e => setStory({ ...story, price: parseFloat(e.target.value) || 0 })}
              className="w-full h-10 px-3 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none" />
          </div>
          <div className="flex-1">
            <label className="text-[14px] text-[var(--inv-muted)]">Series ($)</label>
            <input type="number" step="0.01" value={story.seriesPrice} onChange={e => setStory({ ...story, seriesPrice: parseFloat(e.target.value) || 0 })}
              className="w-full h-10 px-3 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none" />
          </div>
        </Row>
        <button type="button" onClick={handleSave}
          className="w-full h-[48px] rounded-2xl bg-[var(--inv-heading)] text-[var(--inv-bg)] font-semibold text-[16px] cursor-pointer active:scale-[0.96]">
          Save Story
        </button>
      </Stack>
    </Surface>
  )
}

function NodeForm({ storyId }) {
  const [node, setNode] = useState({
    id: '', title: '', description: '', videoUrl: '',
    isEnding: false, endingTitle: '', endingDescription: '',
    timed: false, timerSeconds: 10,
  })
  const [choices, setChoices] = useState([{ label: '', nextNodeId: '', positive: false }])
  const [saved, setSaved] = useState(false)

  const addChoice = () => setChoices([...choices, { label: '', nextNodeId: '', positive: false }])
  const removeChoice = (i) => setChoices(choices.filter((_, j) => j !== i))
  const updateChoice = (i, field, value) => {
    const c = [...choices]
    c[i] = { ...c[i], [field]: value }
    setChoices(c)
  }

  const handleSave = async () => {
    if (!node.id || !storyId) return alert('Node ID required')
    await adminPost('/api/admin/nodes', {
      id: node.id,
      story_id: storyId,
      title: node.title,
      description: node.description,
      video_url: node.videoUrl || `${R2_BASE}/${node.id}.mp4`,
      poster_url: `${R2_BASE}/posters/${node.id}.jpg`,
      is_ending: node.isEnding,
      ending_title: node.endingTitle,
      ending_description: node.endingDescription,
      timed: node.timed,
      timer_seconds: node.timerSeconds,
    })
    if (!node.isEnding && choices.length > 0 && choices[0].label) {
      await adminPost('/api/admin/choices', {
        story_id: storyId,
        node_id: node.id,
        choices: choices.filter(c => c.label).map(c => ({
          label: c.label,
          nextNodeId: c.nextNodeId,
          positive: c.positive,
        })),
      })
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClear = () => {
    setNode({ id: '', title: '', description: '', videoUrl: '', isEnding: false, endingTitle: '', endingDescription: '', timed: false, timerSeconds: 10 })
    setChoices([{ label: '', nextNodeId: '', positive: false }])
  }

  return (
    <Surface padding="md" elevation="sm">
      <Stack gap="sm">
        <Row justify="between">
          <h3 className="inv-heading">Add Scene</h3>
          {saved && <span className="text-green-400 text-[14px] font-medium">Saved!</span>}
        </Row>
        <input placeholder="Node ID (e.g. scene01)" value={node.id} onChange={e => setNode({ ...node, id: e.target.value })}
          className="w-full h-10 px-3 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none" />
        <input placeholder="Scene title" value={node.title} onChange={e => setNode({ ...node, title: e.target.value })}
          className="w-full h-10 px-3 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none" />
        <textarea placeholder="Scene description" value={node.description} onChange={e => setNode({ ...node, description: e.target.value })}
          className="w-full h-16 px-3 py-2 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none resize-none" />
        <input placeholder="Video URL" value={node.videoUrl} onChange={e => setNode({ ...node, videoUrl: e.target.value })}
          className="w-full h-10 px-3 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none" />

        <Row gap="md">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={node.isEnding} onChange={e => setNode({ ...node, isEnding: e.target.checked })} />
            <span className="text-[16px] text-[var(--inv-heading)]">Ending</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={node.timed} onChange={e => setNode({ ...node, timed: e.target.checked })} />
            <span className="text-[16px] text-[var(--inv-heading)]">Timed</span>
          </label>
          {node.timed && (
            <input type="number" value={node.timerSeconds} onChange={e => setNode({ ...node, timerSeconds: parseInt(e.target.value) || 10 })}
              className="w-20 h-10 px-3 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none" placeholder="Sec" />
          )}
        </Row>

        {node.isEnding && (
          <>
            <input placeholder="Ending title" value={node.endingTitle} onChange={e => setNode({ ...node, endingTitle: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none" />
            <textarea placeholder="Ending description" value={node.endingDescription} onChange={e => setNode({ ...node, endingDescription: e.target.value })}
              className="w-full h-16 px-3 py-2 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none resize-none" />
          </>
        )}

        {!node.isEnding && (
          <>
            <Row justify="between" className="mt-2">
              <span className="text-[14px] font-medium text-[var(--inv-muted)] tracking-widest uppercase">Choices</span>
              <button type="button" onClick={addChoice} className="text-[14px] text-[var(--inv-accent)] font-medium cursor-pointer">+ Add</button>
            </Row>
            {choices.map((c, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1">
                  <input placeholder="Choice label" value={c.label} onChange={e => updateChoice(i, 'label', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none mb-1.5" />
                  <input placeholder="Next node ID" value={c.nextNodeId} onChange={e => updateChoice(i, 'nextNodeId', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none" />
                </div>
                <div className="flex flex-col items-center gap-1 pt-2">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={c.positive} onChange={e => updateChoice(i, 'positive', e.target.checked)} />
                    <span className="text-[12px] text-[var(--inv-muted)]">+</span>
                  </label>
                  {choices.length > 1 && (
                    <button type="button" onClick={() => removeChoice(i)} className="text-red-400 text-[12px] cursor-pointer">×</button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        <Row gap="sm" className="mt-2">
          <button type="button" onClick={handleSave}
            className="flex-1 h-[44px] rounded-2xl bg-[var(--inv-heading)] text-[var(--inv-bg)] font-semibold text-[16px] cursor-pointer active:scale-[0.96]">
            Save Scene
          </button>
          <button type="button" onClick={handleClear}
            className="h-[44px] px-4 rounded-2xl bg-[var(--inv-bg-alt)] text-[var(--inv-muted)] font-medium text-[16px] cursor-pointer active:scale-[0.96]">
            Clear
          </button>
        </Row>
      </Stack>
    </Surface>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const [storyId, setStoryId] = useState('')
  const [activeTab, setActiveTab] = useState('story')

  return (
    <main className="min-h-[100dvh] bg-[var(--inv-bg)] pb-28 animate-page-enter">
      <div className="px-6 pt-14 pb-4">
        <Row gap="md" className="mb-4">
          <button type="button" onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-[var(--inv-nav-hover-bg)] active:scale-[0.96]">
            <Icon name="arrow-left" size={20} className="text-[var(--inv-heading)]" />
          </button>
          <h1 className="inv-title">Admin</h1>
        </Row>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['story', 'scenes'].map(tab => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-[16px] font-medium cursor-pointer active:scale-[0.96] ${
                activeTab === tab ? 'bg-[var(--inv-heading)] text-[var(--inv-bg)]' : 'bg-[var(--inv-surface)] text-[var(--inv-muted)]'
              }`}>
              {tab === 'story' ? 'Story' : 'Scenes'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6">
        {activeTab === 'story' && (
          <StoryForm onSave={(id) => { setStoryId(id); setActiveTab('scenes') }} />
        )}
        {activeTab === 'scenes' && (
          <Stack gap="md">
            <Surface padding="sm" elevation="sm">
              <Row gap="sm">
                <input placeholder="Story ID to add scenes to" value={storyId} onChange={e => setStoryId(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-xl bg-[var(--inv-input)] text-[16px] text-[var(--inv-heading)] outline-none" />
              </Row>
            </Surface>
            {storyId && <NodeForm storyId={storyId} />}
            {!storyId && <p className="text-[var(--inv-muted)] text-center py-8">Enter a story ID above to add scenes</p>}
          </Stack>
        )}
      </div>
    </main>
  )
}
