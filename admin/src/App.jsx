import { useState, useEffect } from 'react'
import { admin, isLoggedIn, loginAdmin, logoutAdmin } from './api.js'

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
  const [data, setData] = useState({
    id: '', title: '', description: '', genre: 'Romance',
    preview_url: '', start_node_id: '', trending: false, available: false,
    price: 0, series_price: 4.99, total_endings: 2,
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (story) {
      setData({
        id: story.id || '', title: story.title || '', description: story.description || '',
        genre: story.genre || 'Romance', preview_url: story.preview_url || '',
        start_node_id: story.start_node_id || '', trending: Boolean(story.trending),
        available: Boolean(story.available), price: story.price || 0,
        series_price: story.series_price || 4.99, total_endings: story.total_endings || 2,
      })
    }
  }, [story])

  const save = async () => {
    if (!data.id || !data.title) return setMsg('ID and title required')
    setSaving(true)
    setMsg('')
    try {
      await admin.saveStory({
        ...data,
        poster_url: `${R2_BASE}/posters/${data.id}.jpg`,
      })
      setMsg('Saved!')
      onSaved?.()
    } catch (e) { setMsg('Error: ' + e.message) }
    setSaving(false)
  }

  const field = (label, key, type = 'text') => (
    <div>
      <label className="text-[13px] text-white/40 mb-1 block">{label}</label>
      {type === 'textarea' ? (
        <textarea value={data[key]} onChange={e => setData({ ...data, [key]: e.target.value })}
          className="w-full h-20 px-3 py-2 rounded-lg bg-white/5 text-[15px] text-white outline-none focus:bg-white/8 resize-none" />
      ) : (
        <input type={type} value={data[key]} onChange={e => setData({ ...data, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
          className="w-full h-10 px-3 rounded-lg bg-white/5 text-[15px] text-white outline-none focus:bg-white/8" />
      )}
    </div>
  )

  return (
    <div className="space-y-3">
      <h2 className="text-[18px] font-semibold">{story ? 'Edit Story' : 'New Story'}</h2>
      <div className="grid grid-cols-2 gap-3">
        {field('Story ID', 'id')}
        {field('Title', 'title')}
      </div>
      {field('Description', 'description', 'textarea')}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[13px] text-white/40 mb-1 block">Genre</label>
          <select value={data.genre} onChange={e => setData({ ...data, genre: e.target.value })}
            className="w-full h-10 px-3 rounded-lg bg-white/5 text-[15px] text-white outline-none">
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        {field('Price ($)', 'price', 'number')}
        {field('Series ($)', 'series_price', 'number')}
      </div>
      {field('Preview video URL', 'preview_url')}
      <div className="grid grid-cols-2 gap-3">
        {field('Start node ID', 'start_node_id')}
        {field('Total endings', 'total_endings', 'number')}
      </div>
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

function NodeEditor({ storyId }) {
  const [node, setNode] = useState({
    id: '', title: '', description: '', video_url: '',
    is_ending: false, ending_title: '', ending_description: '',
    timed: false, timer_seconds: 10,
  })
  const [choices, setChoices] = useState([{ label: '', nextNodeId: '', positive: false }])
  const [msg, setMsg] = useState('')
  const [nodes, setNodes] = useState([])

  useEffect(() => {
    if (storyId) {
      admin.getStory(storyId).then(s => {
        if (s?.nodes) setNodes(Object.values(s.nodes))
      }).catch(() => {})
    }
  }, [storyId, msg])

  const save = async () => {
    if (!node.id) return setMsg('Node ID required')
    setMsg('')
    try {
      await admin.saveNode({ ...node, story_id: storyId, poster_url: `${R2_BASE}/posters/${node.id}.jpg` })
      if (!node.is_ending && choices[0]?.label) {
        await admin.saveChoices(storyId, node.id, choices.filter(c => c.label))
      }
      setMsg('Saved!')
      setNode({ id: '', title: '', description: '', video_url: '', is_ending: false, ending_title: '', ending_description: '', timed: false, timer_seconds: 10 })
      setChoices([{ label: '', nextNodeId: '', positive: false }])
    } catch (e) { setMsg('Error: ' + e.message) }
  }

  const editNode = (n) => {
    setNode({
      id: n.id, title: n.title || '', description: n.description || '',
      video_url: n.video_url || '', is_ending: n.is_ending, ending_title: n.ending_title || '',
      ending_description: n.ending_description || '', timed: n.timed, timer_seconds: n.timer_seconds || 10,
    })
    setChoices(n.choices?.length ? n.choices.map(c => ({ label: c.label, nextNodeId: c.nextNodeId, positive: c.positive })) : [{ label: '', nextNodeId: '', positive: false }])
  }

  const field = (label, key, type = 'text') => (
    <div>
      <label className="text-[13px] text-white/40 mb-1 block">{label}</label>
      <input type={type} value={node[key]} onChange={e => setNode({ ...node, [key]: type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })}
        className="w-full h-10 px-3 rounded-lg bg-white/5 text-[15px] text-white outline-none focus:bg-white/8" />
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Existing nodes */}
      {nodes.length > 0 && (
        <div>
          <h3 className="text-[14px] text-white/40 font-medium mb-2">Existing scenes ({nodes.length})</h3>
          <div className="flex flex-wrap gap-1.5">
            {nodes.map(n => (
              <button key={n.id} onClick={() => editNode(n)}
                className={`px-2.5 py-1 rounded text-[13px] cursor-pointer ${
                  n.is_ending ? 'bg-pink-500/15 text-pink-400' : n.timed ? 'bg-orange-500/15 text-orange-400' : 'bg-white/5 text-white/60'
                } ${node.id === n.id ? 'ring-1 ring-white/30' : ''}`}>
                {n.id}
              </button>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-[18px] font-semibold">{node.id && nodes.find(n => n.id === node.id) ? 'Edit Scene' : 'Add Scene'}</h2>
      <div className="grid grid-cols-2 gap-3">
        {field('Node ID', 'id')}
        {field('Title', 'title')}
      </div>
      <div>
        <label className="text-[13px] text-white/40 mb-1 block">Description</label>
        <textarea value={node.description} onChange={e => setNode({ ...node, description: e.target.value })}
          className="w-full h-16 px-3 py-2 rounded-lg bg-white/5 text-[15px] text-white outline-none focus:bg-white/8 resize-none" />
      </div>
      {field('Video URL', 'video_url')}

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={node.is_ending} onChange={e => setNode({ ...node, is_ending: e.target.checked })} className="accent-pink-400" />
          <span className="text-[15px]">Ending</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={node.timed} onChange={e => setNode({ ...node, timed: e.target.checked })} className="accent-orange-400" />
          <span className="text-[15px]">Timed</span>
        </label>
        {node.timed && field('Seconds', 'timer_seconds', 'number')}
      </div>

      {node.is_ending && (
        <div className="grid grid-cols-2 gap-3">
          {field('Ending title', 'ending_title')}
          <div>
            <label className="text-[13px] text-white/40 mb-1 block">Ending description</label>
            <textarea value={node.ending_description} onChange={e => setNode({ ...node, ending_description: e.target.value })}
              className="w-full h-10 px-3 py-2 rounded-lg bg-white/5 text-[15px] text-white outline-none focus:bg-white/8 resize-none" />
          </div>
        </div>
      )}

      {!node.is_ending && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] text-white/40 font-medium">Choices</span>
            <button onClick={() => setChoices([...choices, { label: '', nextNodeId: '', positive: false }])}
              className="text-[14px] text-blue-400 cursor-pointer">+ Add</button>
          </div>
          {choices.map((c, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input placeholder="Choice label" value={c.label} onChange={e => { const nc = [...choices]; nc[i] = { ...nc[i], label: e.target.value }; setChoices(nc) }}
                className="flex-1 h-10 px-3 rounded-lg bg-white/5 text-[15px] text-white outline-none" />
              <input placeholder="→ next node" value={c.nextNodeId} onChange={e => { const nc = [...choices]; nc[i] = { ...nc[i], nextNodeId: e.target.value }; setChoices(nc) }}
                className="w-32 h-10 px-3 rounded-lg bg-white/5 text-[15px] text-white outline-none" />
              <label className="flex items-center gap-1 cursor-pointer shrink-0">
                <input type="checkbox" checked={c.positive} onChange={e => { const nc = [...choices]; nc[i] = { ...nc[i], positive: e.target.checked }; setChoices(nc) }} className="accent-green-400" />
                <span className="text-[13px] text-white/40">+</span>
              </label>
              {choices.length > 1 && (
                <button onClick={() => setChoices(choices.filter((_, j) => j !== i))} className="text-red-400 text-[16px] cursor-pointer px-1">×</button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={save}
          className="px-5 h-10 rounded-lg bg-white text-black font-semibold text-[15px] cursor-pointer active:scale-[0.97]">
          Save Scene
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

  const loadStories = () => {
    admin.getStories().then(setStories).catch(() => {})
  }

  useEffect(() => { if (authed) loadStories() }, [authed])

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />

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
            {['story', 'scenes'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-[15px] font-medium cursor-pointer ${
                  tab === t ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}>
                {t === 'story' ? 'Details' : 'Scenes'}
              </button>
            ))}
          </div>
        )}

        {tab === 'story' && (
          <StoryEditor story={selected} onSaved={loadStories} />
        )}
        {tab === 'scenes' && selected && (
          <NodeEditor storyId={selected.id} />
        )}
      </div>
    </div>
  )
}
