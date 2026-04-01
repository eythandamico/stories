import { useState, useEffect, createContext, useContext } from 'react'
import { onAuthChange, isFirebaseConfigured } from './firebase.js'

const AuthContext = createContext(null)

// Mock user when Firebase isn't configured
const MOCK_USER = { displayName: 'User', email: 'user@example.com', photoURL: null }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(isFirebaseConfigured ? undefined : MOCK_USER)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    const unsub = onAuthChange((u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
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
