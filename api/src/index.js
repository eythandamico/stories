import { verifyToken } from './auth.js'

const ALLOWED_ORIGINS = [
  'https://stories-bph.pages.dev',
  'https://narrative-admin.pages.dev',
  'http://localhost:5173',
  'http://localhost:5174',
  'capacitor://localhost',
  'ionic://localhost',
]

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
  }
}

// Simple HMAC-based admin token
async function createAdminToken(secret) {
  const payload = JSON.stringify({ role: 'admin', exp: Date.now() + 24 * 60 * 60 * 1000 })
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return btoa(payload) + '.' + btoa(String.fromCharCode(...new Uint8Array(sig)))
}

async function verifyAdminToken(token, secret) {
  try {
    const [payloadB64, sigB64] = token.split('.')
    const payload = JSON.parse(atob(payloadB64))
    if (payload.exp < Date.now()) return false
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const sig = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0))
    return await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(JSON.stringify(payload)))
  } catch { return false }
}

let _corsHeaders = {}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ..._corsHeaders },
  })
}

function error(msg, status = 400) {
  return json({ error: 'Request failed' }, status) // Generic errors — don't leak internals
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function authenticate(request, env) {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyToken(auth.slice(7), env.FIREBASE_PROJECT_ID)
}

export default {
  async fetch(request, env) {
    _corsHeaders = getCorsHeaders(request)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: _corsHeaders })
    }

    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    // ── Public routes ──

    // GET /api/feed — list feed items
    if (path === '/api/feed' && method === 'GET') {
      const rows = await env.DB.prepare(`
        SELECT s.*, f.sort_order as feed_order
        FROM feed f
        JOIN stories s ON f.story_id = s.id
        ORDER BY f.sort_order ASC
      `).all()
      return json(rows.results)
    }

    // GET /api/stories — list all stories
    if (path === '/api/stories' && method === 'GET') {
      const rows = await env.DB.prepare('SELECT * FROM stories ORDER BY sort_order ASC').all()
      return json(rows.results)
    }

    // GET /api/stories/:id — get story with nodes and choices
    if (path.match(/^\/api\/stories\/[\w-]+$/) && method === 'GET') {
      const storyId = path.split('/')[3]
      const story = await env.DB.prepare('SELECT * FROM stories WHERE id = ?').bind(storyId).first()
      if (!story) return error('Story not found', 404)

      const nodes = await env.DB.prepare('SELECT * FROM nodes WHERE story_id = ?').bind(storyId).all()
      const choices = await env.DB.prepare('SELECT * FROM choices WHERE story_id = ? ORDER BY sort_order ASC').bind(storyId).all()

      // Build node map with choices
      const nodeMap = {}
      for (const node of nodes.results) {
        nodeMap[node.id] = {
          ...node,
          is_ending: Boolean(node.is_ending),
          timed: Boolean(node.timed),
          choices: choices.results
            .filter(c => c.node_id === node.id)
            .map(c => ({
              label: c.label,
              nextNodeId: c.next_node_id,
              positive: Boolean(c.positive),
            })),
        }
      }

      return json({ ...story, nodes: nodeMap })
    }

    // GET /api/stats/:storyId/:nodeId — get choice stats
    if (path.match(/^\/api\/stats\/[\w-]+\/[\w-]+$/) && method === 'GET') {
      const parts = path.split('/')
      const [storyId, nodeId] = [parts[3], parts[4]]
      const rows = await env.DB.prepare(
        'SELECT choice_index, count FROM choice_stats WHERE story_id = ? AND node_id = ?'
      ).bind(storyId, nodeId).all()
      return json(rows.results)
    }

    // ── Admin login ──
    if (path === '/api/admin/login' && method === 'POST') {
      const { username, password } = await request.json()
      if (!env.ADMIN_SECRET) return error('Admin secret not configured', 500)

      // Check env superadmin first
      if (!env.ADMIN_PASSWORD) return error('Admin not configured', 500)
      if (username === (env.ADMIN_USERNAME || 'admin') && password === env.ADMIN_PASSWORD) {
        const token = await createAdminToken(env.ADMIN_SECRET)
        return json({ token, role: 'superadmin', username })
      }

      // Check admin_users table
      const hash = await hashPassword(password)
      const dbUser = await env.DB.prepare('SELECT * FROM admin_users WHERE username = ? AND password_hash = ?').bind(username, hash).first()
      if (dbUser) {
        const token = await createAdminToken(env.ADMIN_SECRET)
        return json({ token, role: dbUser.role, username: dbUser.username })
      }

      return error('Invalid credentials', 401)
    }

    // ── Authenticated routes ──
    // Check admin token or Firebase user token
    const adminToken = request.headers.get('X-Admin-Token')
    const isAdmin = adminToken && env.ADMIN_SECRET ? await verifyAdminToken(adminToken, env.ADMIN_SECRET) : false

    // Seed key — only works if explicitly configured as a secret
    const seedKey = request.headers.get('X-Seed-Key')
    const isSeedAdmin = env.SEED_KEY ? seedKey === env.SEED_KEY : false

    const user = (isAdmin || isSeedAdmin) ? { uid: 'admin', email: 'admin' } : await authenticate(request, env)
    if (!user) return error('Unauthorized', 401)

    // GET /api/me — get user data
    if (path === '/api/me' && method === 'GET') {
      let userData = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.uid).first()
      if (!userData) {
        // Auto-create user on first request
        await env.DB.prepare(`
          INSERT INTO users (id, email, display_name, photo_url)
          VALUES (?, ?, ?, ?)
        `).bind(user.uid, user.email, user.name, user.picture).run()
        userData = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.uid).first()
      }
      // Get endings
      const endings = await env.DB.prepare(
        'SELECT * FROM user_endings WHERE user_id = ?'
      ).bind(user.uid).all()
      return json({ ...userData, endings: endings.results })
    }

    // PUT /api/me — update user data
    if (path === '/api/me' && method === 'PUT') {
      const body = await request.json()
      const fields = []
      const values = []
      const allowed = ['streak_current', 'streak_best', 'streak_last_play', 'last_heart_loss', 'display_name']
      for (const key of allowed) {
        if (body[key] !== undefined) {
          fields.push(`${key} = ?`)
          values.push(body[key])
        }
      }
      if (fields.length === 0) return error('No valid fields')
      fields.push("updated_at = datetime('now')")
      values.push(user.uid)
      await env.DB.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
      return json({ ok: true })
    }

    // POST /api/me/endings — record a new ending
    if (path === '/api/me/endings' && method === 'POST') {
      const { storyId, endingId, endingTitle } = await request.json()
      try {
        await env.DB.prepare(`
          INSERT INTO user_endings (user_id, story_id, ending_id, ending_title)
          VALUES (?, ?, ?, ?)
        `).bind(user.uid, storyId, endingId, endingTitle).run()
        // Reward heart
        await env.DB.prepare('UPDATE users SET hearts = MIN(hearts + 1, 999) WHERE id = ?').bind(user.uid).run()
        return json({ ok: true, isNew: true })
      } catch {
        return json({ ok: true, isNew: false }) // Already exists
      }
    }

    // POST /api/me/perks/use — use a perk
    if (path === '/api/me/perks/use' && method === 'POST') {
      const { type } = await request.json()
      const col = `perks_${type}`
      if (!['perks_freeze', 'perks_hint', 'perks_rewind'].includes(col)) return error('Invalid perk')
      const result = await env.DB.prepare(
        `UPDATE users SET ${col} = ${col} - 1 WHERE id = ? AND ${col} > 0`
      ).bind(user.uid).run()
      return json({ ok: result.meta.changes > 0 })
    }

    // POST /api/me/hearts/spend — spend a heart
    if (path === '/api/me/hearts/spend' && method === 'POST') {
      const result = await env.DB.prepare(
        "UPDATE users SET hearts = hearts - 1, last_heart_loss = COALESCE(last_heart_loss, datetime('now')) WHERE id = ? AND hearts > 0"
      ).bind(user.uid).run()
      return json({ ok: result.meta.changes > 0 })
    }

    // POST /api/stats — record a choice
    if (path === '/api/stats' && method === 'POST') {
      const { storyId, nodeId, choiceIndex } = await request.json()
      await env.DB.prepare(`
        INSERT INTO choice_stats (story_id, node_id, choice_index, count)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(story_id, node_id, choice_index) DO UPDATE SET count = count + 1
      `).bind(storyId, nodeId, choiceIndex).run()
      return json({ ok: true })
    }

    // ── Admin routes ──
    // POST /api/admin/stories — create/update a story
    if (path === '/api/admin/stories' && method === 'POST') {
      if (!isAdmin && !isSeedAdmin) return error('Admin only', 403)
      try {
        const body = await request.json()
        await env.DB.prepare(`
          INSERT OR REPLACE INTO stories (id, title, description, genre, cover_url, preview_url, poster_url, trending, available, price, series_price, total_endings, start_node_id, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          body.id, body.title || '', body.description || '', body.genre || '',
          body.cover_url || null, body.preview_url || null, body.poster_url || null,
          body.trending ? 1 : 0, body.available ? 1 : 0,
          body.price || 0, body.series_price || 0,
          body.total_endings || 0, body.start_node_id || null, body.sort_order || 0
        ).run()
        return json({ ok: true })
      } catch (e) {
        return error(e.message, 500)
      }
    }

    // POST /api/admin/nodes — create/update a node
    if (path === '/api/admin/nodes' && method === 'POST') {
      if (!isAdmin && !isSeedAdmin) return error('Admin only', 403)
      try {
        const body = await request.json()
        await env.DB.prepare(`
          INSERT OR REPLACE INTO nodes (id, story_id, title, description, video_url, poster_url, is_ending, ending_title, ending_description, timed, timer_seconds)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          body.id, body.story_id, body.title || '', body.description || '',
          body.video_url || null, body.poster_url || null,
          body.is_ending ? 1 : 0, body.ending_title || null, body.ending_description || null,
          body.timed ? 1 : 0, body.timer_seconds || 10
        ).run()
        return json({ ok: true })
      } catch (e) {
        return error(e.message, 500)
      }
    }

    // POST /api/admin/choices — create choices for a node
    if (path === '/api/admin/choices' && method === 'POST') {
      if (!isAdmin && !isSeedAdmin) return error('Admin only', 403)
      try {
        const body = await request.json()
        await env.DB.prepare('DELETE FROM choices WHERE story_id = ? AND node_id = ?')
          .bind(body.story_id, body.node_id).run()
        for (let i = 0; i < body.choices.length; i++) {
          const c = body.choices[i]
          await env.DB.prepare(`
            INSERT INTO choices (story_id, node_id, label, next_node_id, positive, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(body.story_id, body.node_id, c.label, c.nextNodeId, c.positive ? 1 : 0, i).run()
        }
        return json({ ok: true })
      } catch (e) {
        return error(e.message, 500)
      }
    }

    // POST /api/admin/feed — set feed order
    if (path === '/api/admin/feed' && method === 'POST') {
      if (!isAdmin && !isSeedAdmin) return error('Admin only', 403)
      try {
        const body = await request.json()
        await env.DB.prepare('DELETE FROM feed').run()
        for (let i = 0; i < body.items.length; i++) {
          await env.DB.prepare('INSERT INTO feed (story_id, sort_order) VALUES (?, ?)')
            .bind(body.items[i], i).run()
        }
        return json({ ok: true })
      } catch (e) {
        return error(e.message, 500)
      }
    }

    // GET /api/admin/users — list admin users
    if (path === '/api/admin/users' && method === 'GET') {
      if (!isAdmin && !isSeedAdmin) return error('Admin only', 403)
      const rows = await env.DB.prepare('SELECT id, username, role, created_at FROM admin_users ORDER BY created_at DESC').all()
      return json(rows.results)
    }

    // POST /api/admin/users — create admin user
    if (path === '/api/admin/users' && method === 'POST') {
      if (!isAdmin && !isSeedAdmin) return error('Admin only', 403)
      try {
        const { username, password, role } = await request.json()
        if (!username || !password) return error('Username and password required')
        const hash = await hashPassword(password)
        await env.DB.prepare('INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)').bind(username, hash, role || 'editor').run()
        return json({ ok: true })
      } catch (e) {
        if (e.message?.includes('UNIQUE')) return error('Username already exists')
        return error(e.message, 500)
      }
    }

    // DELETE /api/admin/users/:id — delete admin user
    if (path.match(/^\/api\/admin\/users\/\d+$/) && method === 'DELETE') {
      if (!isAdmin && !isSeedAdmin) return error('Admin only', 403)
      const id = path.split('/').pop()
      await env.DB.prepare('DELETE FROM admin_users WHERE id = ?').bind(id).run()
      return json({ ok: true })
    }

    // PUT /api/admin/users/:id — update admin user
    if (path.match(/^\/api\/admin\/users\/\d+$/) && method === 'PUT') {
      if (!isAdmin && !isSeedAdmin) return error('Admin only', 403)
      const id = path.split('/').pop()
      const { role, password } = await request.json()
      if (password) {
        const hash = await hashPassword(password)
        await env.DB.prepare('UPDATE admin_users SET password_hash = ?, role = ? WHERE id = ?').bind(hash, role || 'editor', id).run()
      } else if (role) {
        await env.DB.prepare('UPDATE admin_users SET role = ? WHERE id = ?').bind(role, id).run()
      }
      return json({ ok: true })
    }

    // POST /api/admin/upload — upload video/image to R2
    if (path === '/api/admin/upload' && method === 'POST') {
      if (!isAdmin && !isSeedAdmin) return error('Admin only', 403)
      try {
        const formData = await request.formData()
        const file = formData.get('file')
        if (!file || !file.size) return error('No file provided')
        if (file.size > 100 * 1024 * 1024) return error('File too large (max 100MB)')
        const allowedTypes = ['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) return error('Invalid file type')
        const rawName = (formData.get('filename') || file.name || 'upload').replace(/[^a-zA-Z0-9._-]/g, '')
        const rawFolder = (formData.get('folder') || '').replace(/[^a-zA-Z0-9_-]/g, '')
        const filename = rawName
        const key = rawFolder ? `${rawFolder}/${filename}` : filename

        await env.VIDEOS.put(key, file.stream(), {
          httpMetadata: { contentType: file.type },
        })

        return json({ ok: true, key, url: `https://pub-2c7d56fe4c98425381098ff8d4dfabe4.r2.dev/${key}` })
      } catch (e) {
        return error(e.message, 500)
      }
    }

    // GET /api/admin/files — list R2 files
    if (path === '/api/admin/files' && method === 'GET') {
      if (!isAdmin && !isSeedAdmin) return error('Admin only', 403)
      try {
        const prefix = url.searchParams.get('prefix') || ''
        const list = await env.VIDEOS.list({ prefix, limit: 100 })
        return json(list.objects.map(o => ({ key: o.key, size: o.size, uploaded: o.uploaded })))
      } catch (e) {
        return error(e.message, 500)
      }
    }

    return error('Not found', 404)
  }
}
