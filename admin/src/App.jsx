import { useState, useEffect } from 'react'
import { admin, isLoggedIn, loginAdmin, logoutAdmin } from './api.js'
import StoryBuilder from './StoryBuilder.jsx'

const R2_BASE = 'https://pub-2c7d56fe4c98425381098ff8d4dfabe4.r2.dev'
const GENRES = ['Romance', 'Thriller', 'Sci-Fi', 'Horror', 'Drama', 'Fantasy', 'Comedy']

function StoryList({ stories, onSelect, selected }) {
  return (
    <div className="space-y-1">
      {stories.map(s => (
        <button key={s.id} onClick={() => onSelect(s)}
          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
            selected?.id === s.id ? 'bg-white/10' : 'hover:bg-white/5'
          }`}>
          <div className="flex items-center justify-between">
            <span className="font-medium text-[15px]">{s.title || s.id}</span>
            <div className="flex gap-1.5">
              {s.available ? <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">Live</span> : null}
              {s.trending ? <span className="text-[11px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">Trending</span> : null}
            </div>
          </div>
          <span className="text-[13px] text-white/40">{s.genre} · {s.id}</span>
        </button>
      ))}
    </div>
  )
}

function StoryEditor({ story, onSaved }) {
  const API_URL = import.meta.env.VITE_API_URL || 'https://narrative-api.winter-lake-b4eb.workers.dev'
  const [data, setData] = useState({
    id: '', title: '', description: '', genre: 'Romance',
    preview_url: '', trending: false, available: false,
    price: 0, series_price: 4.99,
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (story) {
      setData({
        id: story.id || '', title: story.title || '', description: story.description || '',
        genre: story.genre || 'Romance', preview_url: story.preview_url || '',
        trending: Boolean(story.trending), available: Boolean(story.available),
        price: story.price || 0, series_price: story.series_price || 4.99,
      })
    }
  }, [story])

  // Auto-generate slug from title
  const handleTitleChange = (title) => {
    const updates = { title }
    if (!story) updates.id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setData(d => ({ ...d, ...updates }))
  }

  const handleUpload = async (e) => {
    const file = (e.target.files || e.dataTransfer?.files)?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filename', `${data.id || 'preview'}-preview.mp4`)
      const token = localStorage.getItem('admin-token')
      const res = await fetch(`${API_URL}/api/admin/upload`, { method: 'POST', body: formData, headers: { 'X-Admin-Token': token } })
      const result = await res.json()
      if (result.url) setData(d => ({ ...d, preview_url: result.url }))
    } catch {}
    setUploading(false)
  }

  const save = async () => {
    if (!data.title) return setMsg('Title required')
    const id = data.id || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    setSaving(true)
    setMsg('')
    try {
      await admin.saveStory({
        ...data,
        id,
        start_node_id: 'scene01',
        total_endings: 0,
        poster_url: `${R2_BASE}/posters/${id}.jpg`,
      })
      setMsg('Saved!')
      onSaved?.()
    } catch (e) { setMsg('Error: ' + e.message) }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-[18px] font-semibold">{story ? 'Edit Story' : 'New Story'}</h2>

      {/* Title */}
      <div>
        <label className="text-[13px] text-white/40 mb-1 block">Title</label>
        <input value={data.title} onChange={e => handleTitleChange(e.target.value)}
          placeholder="Enter story title..."
          className="w-full h-11 px-3 rounded-lg bg-white/5 text-[16px] text-white outline-none focus:bg-white/8" />
        {!story && data.id && <p className="text-[12px] text-white/20 mt-1">ID: {data.id}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="text-[13px] text-white/40 mb-1 block">Description</label>
        <textarea value={data.description} onChange={e => setData({ ...data, description: e.target.value })}
          placeholder="What's this story about?"
          className="w-full h-20 px-3 py-2 rounded-lg bg-white/5 text-[15px] text-white outline-none focus:bg-white/8 resize-none" />
      </div>

      {/* Genre */}
      <div>
        <label className="text-[13px] text-white/40 mb-1 block">Genre</label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map(g => (
            <button key={g} onClick={() => setData({ ...data, genre: g })}
              className={`px-3 py-1.5 rounded-lg text-[14px] cursor-pointer transition-colors ${
                data.genre === g ? 'bg-white text-black font-medium' : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}>{g}</button>
          ))}
        </div>
      </div>

      {/* Preview video */}
      <div>
        <label className="text-[13px] text-white/40 mb-1 block">Preview Video</label>
        {data.preview_url ? (
          <div className="relative rounded-lg overflow-hidden bg-white/5">
            <video src={data.preview_url} className="w-full h-32 object-cover" muted playsInline preload="metadata" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
              <label className="px-3 py-1.5 rounded-lg bg-white/20 text-[13px] text-white cursor-pointer backdrop-blur">Replace<input type="file" accept="video/*" className="hidden" onChange={handleUpload} /></label>
              <button onClick={() => setData(d => ({ ...d, preview_url: '' }))} className="px-3 py-1.5 rounded-lg bg-red-500/20 text-[13px] text-red-400 cursor-pointer">Remove</button>
            </div>
            {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><div className="w-6 h-6 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" /></div>}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-white/10 bg-white/[0.02] cursor-pointer hover:border-white/20 transition-colors"
            onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleUpload(e) }}>
            {uploading ? <div className="w-6 h-6 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" /> : <><span className="text-[24px] mb-1">🎬</span><span className="text-[14px] text-white/30">Drop preview video or click to upload</span></>}
            <input type="file" accept="video/*" className="hidden" onChange={handleUpload} />
          </label>
        )}
      </div>

      {/* Pricing */}
      <div>
        <label className="text-[13px] text-white/40 mb-1 block">Pricing</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[15px]">$</span>
            <input type="number" step="0.01" value={data.price} onChange={e => setData({ ...data, price: parseFloat(e.target.value) || 0 })}
              className="w-full h-10 pl-7 pr-3 rounded-lg bg-white/5 text-[15px] text-white outline-none" placeholder="Chapter" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 text-[12px]">per chapter</span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[15px]">$</span>
            <input type="number" step="0.01" value={data.series_price} onChange={e => setData({ ...data, series_price: parseFloat(e.target.value) || 0 })}
              className="w-full h-10 pl-7 pr-3 rounded-lg bg-white/5 text-[15px] text-white outline-none" placeholder="Series" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 text-[12px]">full series</span>
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.available} onChange={e => setData({ ...data, available: e.target.checked })} className="accent-green-400" />
          <span className="text-[15px]">Available</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.trending} onChange={e => setData({ ...data, trending: e.target.checked })} className="accent-purple-400" />
          <span className="text-[15px]">Trending</span>
        </label>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="px-5 h-10 rounded-lg bg-white text-black font-semibold text-[15px] cursor-pointer active:scale-[0.97] disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Story'}
        </button>
        {msg && <span className={`text-[14px] ${msg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{msg}</span>}
      </div>
    </div>
  )
}


function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginAdmin(username, password)
      onLogin()
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-80 space-y-4">
        <h1 className="text-[24px] font-semibold text-center mb-2">Narrative Admin</h1>
        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} autoFocus
          className="w-full h-12 px-4 rounded-lg bg-white/5 text-[16px] text-white outline-none focus:bg-white/8" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full h-12 px-4 rounded-lg bg-white/5 text-[16px] text-white outline-none focus:bg-white/8" />
        {error && <p className="text-red-400 text-[14px] text-center">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full h-12 rounded-lg bg-white text-black font-semibold text-[16px] cursor-pointer active:scale-[0.97] disabled:opacity-50">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(isLoggedIn())
  const [stories, setStories] = useState([])
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('story')
  const [builderStoryId, setBuilderStoryId] = useState(null)

  const loadStories = () => {
    admin.getStories().then(setStories).catch(() => {})
  }

  useEffect(() => { if (authed) loadStories() }, [authed])

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />
  if (builderStoryId) return <StoryBuilder storyId={builderStoryId} onBack={() => { setBuilderStoryId(null); loadStories() }} />

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/10 p-4 shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-[20px] font-semibold">Narrative Admin</h1>
          <button onClick={() => { logoutAdmin(); setAuthed(false) }} className="text-[13px] text-white/30 cursor-pointer hover:text-white/60">Logout</button>
        </div>
        <p className="text-[13px] text-white/40 mb-4">Story management</p>
        <button onClick={() => { setSelected(null); setTab('story') }}
          className="w-full text-left px-3 py-2 rounded-lg bg-white/5 text-[14px] font-medium cursor-pointer hover:bg-white/10 mb-3">
          + New Story
        </button>
        <StoryList stories={stories} onSelect={(s) => { setSelected(s); setTab('story') }} selected={selected} />
      </div>

      {/* Main */}
      <div className="flex-1 p-6 max-w-3xl">
        {/* Tabs */}
        {selected && (
          <div className="flex gap-2 mb-6">
            {['story', 'builder'].map(t => (
              <button key={t} onClick={() => t === 'builder' ? setBuilderStoryId(selected.id) : setTab(t)}
                className={`px-4 py-2 rounded-lg text-[15px] font-medium cursor-pointer ${
                  tab === t ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}>
                {t === 'story' ? 'Details' : '🔀 Builder'}
              </button>
            ))}
          </div>
        )}

        {tab === 'story' && (
          <StoryEditor story={selected} onSaved={loadStories} />
        )}
      </div>
    </div>
  )
}
