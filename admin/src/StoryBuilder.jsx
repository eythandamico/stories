import { useState, useEffect, useRef, useCallback } from 'react'
import { admin } from './api.js'

const API_URL = import.meta.env.VITE_API_URL || 'https://narrative-api.winter-lake-b4eb.workers.dev'
const R2_BASE = 'https://pub-2c7d56fe4c98425381098ff8d4dfabe4.r2.dev'

const NODE_W = 220
const NODE_MIN_H = 80

function getNodeColor(node) {
  if (node.is_ending) return { bg: '#1a0a14', border: '#ec4899', text: '#fce7f3', accent: '#ec4899' }
  if (node.timed) return { bg: '#1a0f0a', border: '#f97316', text: '#ffedd5', accent: '#f97316' }
  return { bg: '#111827', border: '#374151', text: '#e5e7eb', accent: '#6b7280' }
}

function calculatePositions(nodes, startNodeId) {
  const positions = {}
  const visited = new Set()
  const cols = {}
  function walk(nodeId, depth = 0) {
    if (!nodeId || visited.has(nodeId)) return
    visited.add(nodeId)
    if (!cols[depth]) cols[depth] = 0
    positions[nodeId] = { x: depth * 300 + 40, y: cols[depth] * 160 + 40 }
    cols[depth] += 1
    const node = nodes[nodeId]
    if (node?.choices) node.choices.forEach(c => walk(c.nextNodeId, depth + 1))
  }
  walk(startNodeId)
  Object.keys(nodes).forEach(id => {
    if (!positions[id]) {
      const maxY = Math.max(0, ...Object.values(positions).map(p => p.y))
      positions[id] = { x: 40, y: maxY + 180 }
    }
  })
  return positions
}

function ConnectionLines({ nodes, positions, canvasW, canvasH }) {
  const lines = []
  Object.entries(nodes).forEach(([id, node]) => {
    if (!node.choices || !positions[id]) return
    const from = positions[id]
    node.choices.forEach((choice, i) => {
      const to = positions[choice.nextNodeId]
      if (!to) return
      const x1 = from.x + NODE_W + 7
      const y1 = from.y + 60 + i * 28
      const x2 = to.x - 7
      const y2 = to.y + 28
      const dx = Math.abs(x2 - x1)
      const cpx = Math.max(50, dx * 0.35)
      const color = choice.positive ? '#22c55e' : '#64748b'
      lines.push(
        <g key={`${id}-${i}`}>
          <path d={`M ${x1} ${y1} C ${x1 + cpx} ${y1}, ${x2 - cpx} ${y2}, ${x2} ${y2}`}
            fill="none" stroke={color} strokeWidth={2} opacity={0.5} />
          <polygon points={`${x2},${y2} ${x2 - 8},${y2 - 4} ${x2 - 8},${y2 + 4}`}
            fill={color} opacity={0.6} />
        </g>
      )
    })
  })
  return <svg className="absolute pointer-events-none" style={{ width: canvasW, height: canvasH, zIndex: 0 }}>{lines}</svg>
}

function NodeCard({ node, position, selected, onSelect, onDrag, onStartConnect, onEndConnect, connectingFrom, onAddChoice, onUpdateChoice, onDeleteChoice }) {
  const colors = getNodeColor(node)
  const dragRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const isDropTarget = connectingFrom && connectingFrom.nodeId !== node.id

  const handleMouseDown = (e) => {
    if (e.target.closest('[data-port]') || e.target.closest('[data-input]') || e.target.closest('button')) return
    setDragging(true)
    dragRef.current = { startX: e.clientX - position.x, startY: e.clientY - position.y }
    const move = (e) => { if (dragRef.current) onDrag(node.id, { x: e.clientX - dragRef.current.startX, y: e.clientY - dragRef.current.startY }) }
    const up = () => { setDragging(false); document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  return (
    <div
      className="absolute select-none"
      style={{ left: position.x, top: position.y, width: NODE_W, zIndex: dragging ? 50 : selected ? 10 : 1 }}
      onMouseDown={handleMouseDown}
      onClick={(e) => { if (!e.target.closest('[data-port]') && !e.target.closest('[data-input]') && !e.target.closest('button')) onSelect(node) }}
      onMouseUp={() => { if (isDropTarget) onEndConnect(node.id) }}
    >
      <div
        className="rounded-xl transition-all cursor-grab active:cursor-grabbing"
        style={{
          background: colors.bg,
          border: `2px solid ${isDropTarget ? '#3b82f6' : selected ? '#3b82f6' : colors.border}`,
          boxShadow: isDropTarget ? '0 0 0 3px rgba(59,130,246,0.25)' : selected ? '0 0 0 2px rgba(59,130,246,0.2)' : 'none',
          transform: isDropTarget ? 'scale(1.02)' : 'none',
        }}
      >
        {/* Input port */}
        <div className="absolute left-[-7px] top-[28px] w-3.5 h-3.5 rounded-full border-2" style={{ background: colors.bg, borderColor: colors.border }} />

        {/* Header */}
        <div className="px-3 py-2.5 border-b" style={{ borderColor: `${colors.border}40` }}>
          <div className="text-[13px] font-semibold truncate" style={{ color: colors.text }}>{node.title || node.id}</div>
          <div className="text-[11px] mt-0.5 flex items-center gap-2" style={{ color: colors.accent }}>
            <span>{node.id}</span>
            {node.timed && <span className="px-1 py-px rounded text-[9px] bg-orange-500/15">⏱ {node.timer_seconds || 10}s</span>}
            {node.is_ending && <span className="px-1 py-px rounded text-[9px] bg-pink-500/15">★ End</span>}
          </div>
        </div>

        {/* Choices / Output ports */}
        {!node.is_ending && (
          <div className="px-3 py-2 space-y-1.5">
            {(node.choices || []).map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 group relative">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.positive ? '#22c55e' : '#64748b' }}
                  onClick={(e) => { e.stopPropagation(); onUpdateChoice(node.id, i, { ...c, positive: !c.positive }) }}
                  title="Toggle positive"
                />
                <input
                  data-input="true"
                  value={c.label}
                  onChange={(e) => onUpdateChoice(node.id, i, { ...c, label: e.target.value })}
                  onBlur={() => onUpdateChoice(node.id, i, c, true)}
                  className="flex-1 bg-transparent text-[11px] outline-none min-w-0 truncate"
                  style={{ color: `${colors.text}99` }}
                  placeholder="Choice label..."
                />
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteChoice(node.id, i) }}
                  className="opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 text-[11px] cursor-pointer shrink-0 transition-opacity"
                >×</button>
                {/* Output port for this choice */}
                <div
                  data-port="output"
                  className="absolute right-[-19px] w-3.5 h-3.5 rounded-full cursor-crosshair hover:scale-125 transition-transform border-2"
                  style={{ top: '50%', transform: 'translateY(-50%)', background: c.positive ? '#22c55e' : '#3b82f6', borderColor: colors.bg }}
                  onMouseDown={(e) => { e.stopPropagation(); onStartConnect(node.id, i) }}
                />
              </div>
            ))}
            <button
              onClick={(e) => { e.stopPropagation(); onAddChoice(node.id) }}
              className="text-[11px] cursor-pointer hover:text-blue-300 transition-colors w-full text-left py-0.5"
              style={{ color: `${colors.text}40` }}
            >
              + Add choice
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function NodeEditor({ node, storyId, onSaved, onClose }) {
  const [data, setData] = useState({})
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (node) setData({
      id: node.id || '', title: node.title || '', description: node.description || '',
      video_url: node.video_url || '', is_ending: Boolean(node.is_ending),
      ending_title: node.ending_title || '', ending_description: node.ending_description || '',
      timed: Boolean(node.timed), timer_seconds: node.timer_seconds || 10,
    })
  }, [node])

  const handleUpload = async (e) => {
    const file = (e.target.files || e.dataTransfer?.files)?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filename', `${data.id || 'upload'}.mp4`)
      const token = localStorage.getItem('admin-token')
      const res = await fetch(`${API_URL}/api/admin/upload`, { method: 'POST', body: formData, headers: { 'X-Admin-Token': token } })
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
      setMsg('Saved!')
      onSaved?.()
    } catch (e) { setMsg('Error: ' + e.message) }
  }

  if (!node) return null

  return (
    <div className="w-72 border-l border-white/10 p-4 overflow-y-auto shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[16px] font-semibold">Scene</h3>
        <button onClick={onClose} className="text-white/30 cursor-pointer hover:text-white/60 text-[16px]">✕</button>
      </div>
      <div className="space-y-2.5">
        <input placeholder="Node ID" value={data.id} onChange={e => setData({ ...data, id: e.target.value })}
          className="w-full h-9 px-3 rounded-lg bg-white/5 text-[14px] text-white outline-none" />
        <input placeholder="Title" value={data.title} onChange={e => setData({ ...data, title: e.target.value })}
          className="w-full h-9 px-3 rounded-lg bg-white/5 text-[14px] text-white outline-none" />
        <textarea placeholder="Description" value={data.description} onChange={e => setData({ ...data, description: e.target.value })}
          className="w-full h-14 px-3 py-2 rounded-lg bg-white/5 text-[14px] text-white outline-none resize-none" />

        {/* Video dropzone */}
        {data.video_url ? (
          <div className="relative rounded-lg overflow-hidden bg-white/5">
            <video src={data.video_url} className="w-full h-20 object-cover" muted playsInline preload="metadata" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
              <label className="px-2.5 py-1 rounded bg-white/20 text-[12px] text-white cursor-pointer">Replace<input type="file" accept="video/*" className="hidden" onChange={handleUpload} /></label>
              <button onClick={() => setData(d => ({ ...d, video_url: '' }))} className="px-2.5 py-1 rounded bg-red-500/20 text-[12px] text-red-400 cursor-pointer">Remove</button>
            </div>
            {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><div className="w-5 h-5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" /></div>}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-20 rounded-lg border-2 border-dashed border-white/10 bg-white/[0.02] cursor-pointer hover:border-white/20 transition-colors"
            onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleUpload(e) }}>
            {uploading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" /> : <><span className="text-[16px] mb-0.5">🎬</span><span className="text-[12px] text-white/30">Drop or click</span></>}
            <input type="file" accept="video/*" className="hidden" onChange={handleUpload} />
          </label>
        )}

        <div className="flex gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-[14px]"><input type="checkbox" checked={data.is_ending} onChange={e => setData({ ...data, is_ending: e.target.checked })} className="accent-pink-400" /> Ending</label>
          <label className="flex items-center gap-1.5 cursor-pointer text-[14px]"><input type="checkbox" checked={data.timed} onChange={e => setData({ ...data, timed: e.target.checked })} className="accent-orange-400" /> Timed</label>
          {data.timed && <input type="number" value={data.timer_seconds} onChange={e => setData({ ...data, timer_seconds: parseInt(e.target.value) || 10 })} className="w-12 h-8 px-2 rounded bg-white/5 text-[14px] text-white outline-none" />}
        </div>
        {data.is_ending && (
          <>
            <input placeholder="Ending title" value={data.ending_title} onChange={e => setData({ ...data, ending_title: e.target.value })} className="w-full h-9 px-3 rounded-lg bg-white/5 text-[14px] text-white outline-none" />
            <textarea placeholder="Ending description" value={data.ending_description} onChange={e => setData({ ...data, ending_description: e.target.value })} className="w-full h-14 px-3 py-2 rounded-lg bg-white/5 text-[14px] text-white outline-none resize-none" />
          </>
        )}
        <div className="flex items-center gap-2 pt-1">
          <button onClick={save} className="flex-1 h-9 rounded-lg bg-white text-black font-semibold text-[14px] cursor-pointer active:scale-[0.97]">Save</button>
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
  const [connectingFrom, setConnectingFrom] = useState(null)
  const [connectMousePos, setConnectMousePos] = useState(null)
  const [zoom, setZoom] = useState(0.85)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const canvasRef = useRef(null)
  const panRef = useRef(null)

  const load = useCallback(() => {
    admin.getStory(storyId).then(s => {
      if (s) { setStory(s); setNodes(s.nodes || {}); setPositions(p => Object.keys(p).length ? p : calculatePositions(s.nodes || {}, s.start_node_id)) }
    })
  }, [storyId])

  useEffect(() => { load() }, [load])

  const handleDrag = (nodeId, pos) => setPositions(p => ({ ...p, [nodeId]: pos }))

  const handleStartConnect = (nodeId, choiceIndex) => {
    setConnectingFrom({ nodeId, choiceIndex })
    const move = (e) => setConnectMousePos({ x: (e.clientX - pan.x) / zoom, y: (e.clientY - pan.y) / zoom })
    const up = () => { setConnectingFrom(null); setConnectMousePos(null); document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  const handleEndConnect = async (targetNodeId) => {
    if (!connectingFrom || connectingFrom.nodeId === targetNodeId) return
    const node = nodes[connectingFrom.nodeId]
    if (!node) return
    const updatedChoices = [...(node.choices || [])]
    if (connectingFrom.choiceIndex !== undefined && updatedChoices[connectingFrom.choiceIndex]) {
      updatedChoices[connectingFrom.choiceIndex] = { ...updatedChoices[connectingFrom.choiceIndex], nextNodeId: targetNodeId }
    }
    await admin.saveChoices(storyId, connectingFrom.nodeId, updatedChoices)
    setConnectingFrom(null); setConnectMousePos(null); load()
  }

  const handleAddChoice = async (nodeId) => {
    const node = nodes[nodeId]
    if (!node) return
    const num = (node.choices?.length || 0) + 1
    const updatedChoices = [...(node.choices || []), { label: `Choice ${num}`, nextNodeId: '', positive: false }]
    await admin.saveChoices(storyId, nodeId, updatedChoices)
    load()
  }

  const handleUpdateChoice = async (nodeId, index, choice, save = false) => {
    setNodes(prev => {
      const updated = { ...prev }
      const node = { ...updated[nodeId] }
      const choices = [...(node.choices || [])]
      choices[index] = choice
      node.choices = choices
      updated[nodeId] = node
      return updated
    })
    if (save) {
      const node = nodes[nodeId]
      const choices = [...(node.choices || [])]
      choices[index] = choice
      await admin.saveChoices(storyId, nodeId, choices)
    }
  }

  const handleDeleteChoice = async (nodeId, index) => {
    const node = nodes[nodeId]
    const choices = (node.choices || []).filter((_, i) => i !== index)
    await admin.saveChoices(storyId, nodeId, choices)
    load()
  }

  const addNode = async () => {
    const id = `scene${String(Object.keys(nodes).length + 1).padStart(2, '0')}`
    await admin.saveNode({ id, story_id: storyId, title: 'New Scene', description: '' })
    const maxY = Math.max(0, ...Object.values(positions).map(p => p.y))
    setPositions(p => ({ ...p, [id]: { x: 300, y: maxY + 180 } }))
    load()
  }

  const handleCanvasMouseDown = (e) => {
    if (e.target !== canvasRef.current) return
    panRef.current = { startX: e.clientX - pan.x, startY: e.clientY - pan.y }
    const move = (e) => { if (panRef.current) setPan({ x: e.clientX - panRef.current.startX, y: e.clientY - panRef.current.startY }) }
    const up = () => { panRef.current = null; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  const canvasW = Math.max(1400, ...Object.values(positions).map(p => p.x + NODE_W + 200))
  const canvasH = Math.max(900, ...Object.values(positions).map(p => p.y + 200))

  return (
    <div className="flex h-screen bg-[#070710]">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <button onClick={onBack} className="h-9 px-3 rounded-lg bg-white/10 text-[14px] text-white/70 cursor-pointer hover:bg-white/15 backdrop-blur">← Back</button>
        <span className="text-[16px] font-semibold text-white/80">{story?.title || storyId}</span>
        <button onClick={addNode} className="h-9 px-3 rounded-lg bg-blue-500/20 text-[14px] text-blue-400 cursor-pointer hover:bg-blue-500/30">+ Scene</button>
        <div className="flex items-center gap-1 ml-2">
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="w-8 h-8 rounded bg-white/5 text-white/40 cursor-pointer hover:bg-white/10">−</button>
          <span className="text-[13px] text-white/40 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-8 h-8 rounded bg-white/5 text-white/40 cursor-pointer hover:bg-white/10">+</button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4 text-[12px] text-white/30">
        <span>Drag blue port → scene to connect</span>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#22c55e]" /> Positive</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#64748b]" /> Neutral</div>
      </div>

      {/* Canvas */}
      <div ref={canvasRef} className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
        onMouseDown={handleCanvasMouseDown} onWheel={(e) => setZoom(z => Math.max(0.3, Math.min(2, z - e.deltaY * 0.001)))}>
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', width: canvasW, height: canvasH, position: 'relative' }}>
          {/* Grid */}
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.04 }}>
            <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <ConnectionLines nodes={nodes} positions={positions} canvasW={canvasW} canvasH={canvasH} />

          {/* Drag line */}
          {connectingFrom && connectMousePos && positions[connectingFrom.nodeId] && (
            <svg className="absolute pointer-events-none" style={{ width: canvasW, height: canvasH, zIndex: 100 }}>
              <line
                x1={positions[connectingFrom.nodeId].x + NODE_W + 7}
                y1={positions[connectingFrom.nodeId].y + 60 + (connectingFrom.choiceIndex || 0) * 28}
                x2={connectMousePos.x} y2={connectMousePos.y}
                stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" opacity={0.7}
              />
            </svg>
          )}

          {Object.values(nodes).map(node => positions[node.id] && (
            <NodeCard key={node.id} node={node} position={positions[node.id]}
              selected={selectedNode?.id === node.id} onSelect={setSelectedNode} onDrag={handleDrag}
              onStartConnect={handleStartConnect} onEndConnect={handleEndConnect} connectingFrom={connectingFrom}
              onAddChoice={handleAddChoice} onUpdateChoice={handleUpdateChoice} onDeleteChoice={handleDeleteChoice}
            />
          ))}
        </div>
      </div>

      {selectedNode && (
        <NodeEditor node={selectedNode} storyId={storyId}
          onSaved={() => { load(); setSelectedNode(null) }} onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  )
}
