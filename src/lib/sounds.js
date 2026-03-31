const AudioContext = window.AudioContext || window.webkitAudioContext
let ctx = null

function getCtx() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playTone(freq, duration, type = 'sine', gain = 0.08, fadeOut = true) {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = type
    osc.frequency.value = freq
    g.gain.value = gain
    if (fadeOut) g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
    osc.connect(g)
    g.connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + duration)
  } catch {}
}

// Soft click — choice selection
export function soundClick() {
  playTone(800, 0.06, 'sine', 0.05)
}

// Positive choice — warm ascending
export function soundPositive() {
  playTone(523, 0.12, 'sine', 0.06)
  setTimeout(() => playTone(659, 0.12, 'sine', 0.06), 80)
  setTimeout(() => playTone(784, 0.18, 'sine', 0.05), 160)
}

// Negative/neutral choice — soft descending
export function soundNeutral() {
  playTone(440, 0.15, 'sine', 0.04)
  setTimeout(() => playTone(392, 0.2, 'sine', 0.03), 100)
}

// Connection increase — sparkle
export function soundConnection() {
  playTone(1047, 0.08, 'sine', 0.04)
  setTimeout(() => playTone(1319, 0.08, 'sine', 0.04), 60)
  setTimeout(() => playTone(1568, 0.12, 'sine', 0.03), 120)
}

// Timer tick — subtle clock
export function soundTick() {
  playTone(1200, 0.03, 'square', 0.02)
}

// Timer warning — last 3 seconds
export function soundTimerWarn() {
  playTone(880, 0.08, 'sine', 0.06)
}

// Timer expired — dramatic low
export function soundTimerExpired() {
  playTone(220, 0.3, 'sine', 0.08)
  setTimeout(() => playTone(165, 0.4, 'sine', 0.06), 150)
}

// New ending discovered
export function soundEndingDiscovered() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.2, 'sine', 0.05), i * 100)
  })
}

// Heartbeat — for tense moments
let heartbeatInterval = null
export function startHeartbeat(bpm = 80) {
  stopHeartbeat()
  const ms = (60 / bpm) * 1000
  const beat = () => {
    playTone(60, 0.08, 'sine', 0.1, false)
    setTimeout(() => playTone(50, 0.06, 'sine', 0.06, false), 120)
  }
  beat()
  heartbeatInterval = setInterval(beat, ms)
}

export function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
}

// Buy hearts — cash register
export function soundPurchase() {
  playTone(523, 0.05, 'sine', 0.06)
  setTimeout(() => playTone(784, 0.05, 'sine', 0.06), 50)
  setTimeout(() => playTone(1047, 0.15, 'sine', 0.05), 100)
}
