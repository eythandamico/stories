// Verify Firebase ID token with full cryptographic signature verification
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

let cachedJwks = null
let jwksCacheExpiry = 0

async function getJwks() {
  if (cachedJwks && Date.now() < jwksCacheExpiry) return cachedJwks
  const res = await fetch(JWKS_URL)
  const data = await res.json()
  const cacheControl = res.headers.get('cache-control') || ''
  const maxAge = parseInt(cacheControl.match(/max-age=(\d+)/)?.[1] || '3600')
  cachedJwks = data.keys
  jwksCacheExpiry = Date.now() + maxAge * 1000
  return cachedJwks
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return atob(str)
}

function base64UrlToArrayBuffer(str) {
  const binary = base64UrlDecode(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export async function verifyToken(token, projectId) {
  if (!token) return null

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, signatureB64] = parts
    const header = JSON.parse(base64UrlDecode(headerB64))
    const payload = JSON.parse(base64UrlDecode(payloadB64))

    // Validate claims
    if (payload.aud !== projectId) return null
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null
    if (payload.exp < Date.now() / 1000) return null
    if (!payload.sub) return null

    // Get the signing key
    const jwks = await getJwks()
    const jwk = jwks.find(k => k.kid === header.kid)
    if (!jwk) return null

    // Import the public key
    const key = await crypto.subtle.importKey(
      'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
    )

    // Verify signature
    const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    const signature = base64UrlToArrayBuffer(signatureB64)
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signedData)

    if (!valid) return null

    return {
      uid: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    }
  } catch {
    return null
  }
}
