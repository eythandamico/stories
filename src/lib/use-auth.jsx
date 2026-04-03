import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { onAuthChange, isFirebaseConfigured } from './firebase.js'

const AuthContext = createContext(null)

// Mock user when Firebase isn't configured
const MOCK_USER = { displayName: 'User', email: 'user@example.com', photoURL: null }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(isFirebaseConfigured ? undefined : MOCK_USER)
  const [loading, setLoading] = useState(isFirebaseConfigured)
  const resolved = useRef(false)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    const unsub = onAuthChange((u) => {
      resolved.current = true
      setUser(u)
      setLoading(false)
    })
    // Timeout fallback — if Firebase never responds, stop loading
    const timeout = setTimeout(() => {
      if (!resolved.current) {
        console.warn('Firebase auth timeout — falling back')
        setUser(null)
        setLoading(false)
      }
    }, 5000)
    return () => { unsub(); clearTimeout(timeout) }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
