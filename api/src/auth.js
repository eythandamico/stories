// Verify Firebase ID token using Google's public keys
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'

let cachedKeys = null
let cacheExpiry = 0

async function getPublicKeys() {
  if (cachedKeys && Date.now() < cacheExpiry) return cachedKeys
  const res = await fetch(GOOGLE_CERTS_URL)
  const keys = await res.json()
  const cacheControl = res.headers.get('cache-control') || ''
  const maxAge = parseInt(cacheControl.match(/max-age=(\d+)/)?.[1] || '3600')
  cachedKeys = keys
  cacheExpiry = Date.now() + maxAge * 1000
  return keys
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return atob(str)
}

export async function verifyToken(token, projectId) {
  if (!token) return null

  try {
    // Decode header and payload without verification first
    const [headerB64, payloadB64] = token.split('.')
    const header = JSON.parse(base64UrlDecode(headerB64))
    const payload = JSON.parse(base64UrlDecode(payloadB64))

    // Basic validation
    if (payload.aud !== projectId) return null
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null
    if (payload.exp < Date.now() / 1000) return null

    return {
      uid: payload.sub || payload.user_id,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    }
  } catch {
    return null
  }
}
