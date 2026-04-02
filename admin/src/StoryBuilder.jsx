import { useState, useEffect, useRef, useCallback } from 'react'
import { admin } from './api.js'

const API_URL = import.meta.env.VITE_API_URL || 'https://narrative-api.winter-lake-b4eb.workers.dev'
const R2_BASE = 'https://pub-2c7d56fe4c98425381098ff8d4dfabe4.r2.dev'

const NODE_W = 200
const NODE_H = 100

function getNodeColor(node) {
  if (node.is_ending) return { bg: '#831843', border: '#ec4899', text: '#fce7f3' }
  if (node.timed) return { bg: '#7c2d12', border: '#f97316', text: '#ffedd5' }
  return { bg: '#1e293b', border: '#475569', text: '#e2e8f0' }
}

function calculatePositions(nodes, startNodeId) {
  const positions = {}
  const visited = new Set()
  const cols = {}

  function walk(nodeId, depth = 0, lane = 0) {
    if (!nodeId || visited.has(nodeId)) return
    visited.add(nodeId)
    if (!cols[depth]) cols[depth] = 0
    const y = cols[depth]
    cols[depth] += 1
    positions[nodeId] = { x: depth * 280 + 40, y: y * 140 + 40 }
    const node = nodes[nodeId]
    if (node?.choices) {
      node.choices.forEach((c, i) => walk(c.nextNodeId, depth + 1, lane + i))
    }
  }

  walk(startNodeId)
  // Place unvisited nodes
  Object.keys(nodes).forEach(id => {
    if (!positions[id]) {
      const maxY = Math.max(0, ...Object.values(positions).map(p => p.y))
      positions[id] = { x: 40, y: maxY + 160 }
    }
  })
  return positions
}

function ConnectionLines({ nodes, positions }) {
  const lines = []
  Object.entries(nodes).forEach(([id, node]) => {
    if (!node.choices || !positions[id]) return
    const from = positions[id]
    node.choices.forEach((choice, i) => {
      const to = positions[choice.nextNodeId]
      if (!to) return
      const x1 = from.x + NODE_W
      const y1 = from.y + 50 + i * 20
      const x2 = to.x
      const y2 = to.y + NODE_H / 2
      const cx1 = x1 + 60
      const cx2 = x2 - 60
      lines.push(
        <g key={`${id}-${i}`}>
          <path
            d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
            fill="none"
            stroke={choice.positive ? '#22c55e' : '#64748b'}
            strokeWidth={2}
            opacity={0.5}
          />
          <circle cx={x2} cy={y2} r={4} fill={choice.positive ? '#22c55e' : '#64748b'} opacity={0.7} />
        </g>
      )
    })
  })
  return <svg className="absolute inset-0 w-full h-full pointer-events-none">{lines}</svg>
}

function NodeCard({ node, position, selected, onSelect, onDrag }) {
  const colors = getNodeColor(node)
  const dragRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'BUTTON') return
    setDragging(true)
    dragRef.current = { startX: e.clientX - position.x, startY: e.clientY - position.y }
    const handleMove = (e) => {
      if (dragRef.current) {
        onDrag(node.id, { x: e.clientX - dragRef.current.startX, y: e.clientY - dragRef.current.startY })
      }
    }
    const handleUp = () => {
      setDragging(false)
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  return (
    <div
      className="absolute cursor-grab active:cursor-grabbing select-none"
      style={{
        left: position.x, top: position.y,
        width: NODE_W, zIndex: dragging ? 50 : selected ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
      onClick={() => onSelect(node)}
    >
      <div
        className="rounded-xl p-3 transition-shadow"
        style={{
          background: colors.bg,
          border: `2px solid ${selected ? '#3b82f6' : colors.border}`,
          boxShadow: selected ? '0 0 0 2px rgba(59,130,246,0.3)' : 'none',
        }}
      >
        <div className="text-[13px] font-semibold truncate" style={{ color: colors.text }}>{node.title || node.id}</div>
        <div className="text-[11px] truncate mt-0.5" style={{ color: colors.text, opacity: 0.6 }}>{node.id}</div>
        {node.choices && (
          <div className="mt-2 space-y-0.5">
            {node.choices.map((c, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.positive ? '#22c55e' : '#64748b' }} />
                <span className="text-[10px] truncate" style={{ color: colors.text, opacity: 0.5 }}>{c.label}</span>
              </div>
            ))}
          </div>
        )}
        {node.is_ending && (
          <div className="mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 inline-block">
            Ending
          </div>
        )}
        {node.timed && (
          <div className="mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 inline-block">
            {node.timer_seconds || 10}s
          </div>
        )}
      </div>
    </div>
  )
}

function NodeEditor({ node, storyId, onSaved, onClose }) {
  const [data, setData] = useState({})
  const [choices, setChoices] = useState([])
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (node) {
      setData({
        id: node.id || '', title: node.title || '', description: node.description || '',
        video_url: node.video_url || '', is_ending: Boolean(node.is_ending),
        ending_title: node.ending_title || '', ending_description: node.ending_description || '',
        timed: Boolean(node.timed), timer_seconds: node.timer_seconds || 10,
      })
      setChoices(node.choices?.length ? node.choices.map(c => ({
        label: c.label, nextNodeId: c.nextNodeId, positive: Boolean(c.positive),
      })) : [{ label: '', nextNodeId: '', positive: false }])
    }
  }, [node])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filename', `${data.id || 'upload'}.mp4`)
      const token = localStorage.getItem('admin-token')
      const res = await fetch(`${API_URL}/api/admin/upload`, {
        method: 'POST', body: formData,
        headers: { 'X-Admin-Token': token },
      })
      const result = await res.json()
      if (result.url) setData(d => ({ ...d, video_url: result.url }))
    } catch {}
    setUploading(false)
  }

  const save = async () => {
    if (!data.id) return setMsg('Node ID required')
    setMsg('')
    try {
      await admin.saveNode({ ...data, story_id: storyId, poster_url: `${R2_BASE}/posters/${data.id}.jpg` })
      if (!data.is_ending && choices[0]?.label) {
        await admin.saveChoices(storyId, data.id, choices.filter(c => c.label))
      }
      setMsg('Saved!')
      onSaved?.()
    } catch (e) { setMsg('Error: ' + e.message) }
  }

  if (!node) return null

  return (
    <div className="w-80 border-l border-white/10 p-4 overflow-y-auto shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[16px] font-semibold">Edit Scene</h3>
        <button onClick={onClose} className="text-white/30 cursor-pointer hover:text-white/60">✕</button>
      </div>

      <div className="space-y-2.5">
        <input placeholder="Node ID" value={data.id} onChange={e => setData({ ...data, id: e.target.value })}
          className="w-full h-9 px-3 rounded-lg bg-white/5 text-[14px] text-white outline-none" />
        <input placeholder="Title" value={data.title} onChange={e => setData({ ...data, title: e.target.value })}
          className="w-full h-9 px-3 rounded-lg bg-white/5 text-[14px] text-white outline-none" />
        <textarea placeholder="Description" value={data.description} onChange={e => setData({ ...data, description: e.target.value })}
          className="w-full h-14 px-3 py-2 rounded-lg bg-white/5 text-[14px] text-white outline-none resize-none" />

        {/* Video upload */}
        <div>
          <label className="text-[12px] text-white/40 block mb-1">Video</label>
          <div className="flex gap-2">
            <input placeholder="URL" value={data.video_url} onChange={e => setData({ ...data, video_url: e.target.value })}
              className="flex-1 h-9 px-3 rounded-lg bg-white/5 text-[13px] text-white outline-none" />
            <label className="h-9 px-3 rounded-lg bg-white/10 flex items-center cursor-pointer text-[13px] text-white/60 hover:bg-white/15 shrink-0">
              {uploading ? '...' : '↑'}
              <input type="file" accept="video/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-[14px]">
            <input type="checkbox" checked={data.is_ending} onChange={e => setData({ ...data, is_ending: e.target.checked })} className="accent-pink-400" />
            Ending
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-[14px]">
            <input type="checkbox" checked={data.timed} onChange={e => setData({ ...data, timed: e.target.checked })} className="accent-orange-400" />
            Timed
          </label>
          {data.timed && (
            <input type="number" value={data.timer_seconds} onChange={e => setData({ ...data, timer_seconds: parseInt(e.target.value) || 10 })}
              className="w-14 h-8 px-2 rounded bg-white/5 text-[14px] text-white outline-none" />
          )}
        </div>

        {data.is_ending && (
          <>
            <input placeholder="Ending title" value={data.ending_title} onChange={e => setData({ ...data, ending_title: e.target.value })}
              className="w-full h-9 px-3 rounded-lg bg-white/5 text-[14px] text-white outline-none" />
            <textarea placeholder="Ending description" value={data.ending_description} onChange={e => setData({ ...data, ending_description: e.target.value })}
              className="w-full h-14 px-3 py-2 rounded-lg bg-white/5 text-[14px] text-white outline-none resize-none" />
          </>
        )}

        {!data.is_ending && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] text-white/40 font-medium uppercase tracking-wider">Choices</span>
              <button onClick={() => setChoices([...choices, { label: '', nextNodeId: '', positive: false }])}
                className="text-[12px] text-blue-400 cursor-pointer">+ Add</button>
            </div>
            {choices.map((c, i) => (
              <div key={i} className="flex gap-1.5 mb-1.5">
                <input placeholder="Label" value={c.label} onChange={e => { const nc = [...choices]; nc[i] = { ...nc[i], label: e.target.value }; setChoices(nc) }}
                  className="flex-1 h-8 px-2 rounded bg-white/5 text-[13px] text-white outline-none" />
                <input placeholder="→ node" value={c.nextNodeId} onChange={e => { const nc = [...choices]; nc[i] = { ...nc[i], nextNodeId: e.target.value }; setChoices(nc) }}
                  className="w-20 h-8 px-2 rounded bg-white/5 text-[13px] text-white outline-none" />
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={c.positive} onChange={e => { const nc = [...choices]; nc[i] = { ...nc[i], positive: e.target.checked }; setChoices(nc) }} className="accent-green-400" />
                </label>
                {choices.length > 1 && (
                  <button onClick={() => setChoices(choices.filter((_, j) => j !== i))} className="text-red-400 text-[14px] cursor-pointer">×</button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button onClick={save}
            className="flex-1 h-9 rounded-lg bg-white text-black font-semibold text-[14px] cursor-pointer active:scale-[0.97]">
            Save
          </button>
          {msg && <span className={`text-[13px] ${msg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{msg}</span>}
        </div>
      </div>
    </div>
  )
}

export default function StoryBuilder({ storyId, onBack }) {
  const [story, setStory] = useState(null)
  const [nodes, setNodes] = useState({})
  const [positions, setPositions] = useState({})
  const [selectedNode, setSelectedNode] = useState(null)
  const [zoom, setZoom] = useState(0.85)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const canvasRef = useRef(null)
  const panRef = useRef(null)

  const load = useCallback(() => {
    admin.getStory(storyId).then(s => {
      if (s) {
        setStory(s)
        setNodes(s.nodes || {})
        setPositions(calculatePositions(s.nodes || {}, s.start_node_id))
      }
    })
  }, [storyId])

  useEffect(() => { load() }, [load])

  const handleDrag = (nodeId, pos) => {
    setPositions(p => ({ ...p, [nodeId]: pos }))
  }

  const handleCanvasMouseDown = (e) => {
    if (e.target !== canvasRef.current) return
    panRef.current = { startX: e.clientX - pan.x, startY: e.clientY - pan.y }
    const handleMove = (e) => {
      if (panRef.current) setPan({ x: e.clientX - panRef.current.startX, y: e.clientY - panRef.current.startY })
    }
    const handleUp = () => {
      panRef.current = null
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  const addNode = () => {
    const id = `scene${String(Object.keys(nodes).length + 1).padStart(2, '0')}`
    const maxY = Math.max(0, ...Object.values(positions).map(p => p.y))
    const newNode = { id, title: 'New Scene', description: '', is_ending: false, timed: false, choices: [] }
    setNodes(n => ({ ...n, [id]: newNode }))
    setPositions(p => ({ ...p, [id]: { x: 300, y: maxY + 160 } }))
    setSelectedNode(newNode)
  }

  const canvasW = Math.max(1200, ...Object.values(positions).map(p => p.x + NODE_W + 100))
  const canvasH = Math.max(800, ...Object.values(positions).map(p => p.y + NODE_H + 100))

  return (
    <div className="flex h-screen">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <button onClick={onBack}
          className="h-9 px-3 rounded-lg bg-white/10 text-[14px] text-white/70 cursor-pointer hover:bg-white/15 backdrop-blur">
          ← Back
        </button>
        <span className="text-[16px] font-semibold text-white/80">{story?.title || storyId}</span>
        <button onClick={addNode}
          className="h-9 px-3 rounded-lg bg-blue-500/20 text-[14px] text-blue-400 cursor-pointer hover:bg-blue-500/30">
          + Add Scene
        </button>
        <div className="flex items-center gap-1 ml-2">
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="w-8 h-8 rounded bg-white/5 text-white/40 cursor-pointer hover:bg-white/10 text-[16px]">−</button>
          <span className="text-[13px] text-white/40 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-8 h-8 rounded bg-white/5 text-white/40 cursor-pointer hover:bg-white/10 text-[16px]">+</button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4 text-[12px] text-white/40">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-[#475569]" /> Normal</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-[#f97316]" /> Timed</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-[#ec4899]" /> Ending</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#22c55e]" /> Positive</div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-hidden bg-[#0a0a0a] relative cursor-grab active:cursor-grabbing"
        onMouseDown={handleCanvasMouseDown}
        onWheel={(e) => setZoom(z => Math.max(0.3, Math.min(2, z - e.deltaY * 0.001)))}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: canvasW, height: canvasH,
            position: 'relative',
          }}
        >
          {/* Grid */}
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.05 }}>
            <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <ConnectionLines nodes={nodes} positions={positions} />

          {Object.values(nodes).map(node => positions[node.id] && (
            <NodeCard
              key={node.id}
              node={node}
              position={positions[node.id]}
              selected={selectedNode?.id === node.id}
              onSelect={setSelectedNode}
              onDrag={handleDrag}
            />
          ))}
        </div>
      </div>

      {/* Editor panel */}
      {selectedNode && (
        <NodeEditor
          node={selectedNode}
          storyId={storyId}
          onSaved={() => { load(); setSelectedNode(null) }}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  )
}
