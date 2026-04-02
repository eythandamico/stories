import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithEmail, signupWithEmail, loginWithGoogle, loginWithApple } from '../lib/firebase.js'
import Icon from '../lib/icon.jsx'

export default function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout — check your internet')), 10000))
      const auth = mode === 'signup'
        ? signupWithEmail(email, password, name)
        : loginWithEmail(email, password)
      await Promise.race([auth, timeout])
      navigate('/')
    } catch (err) {
      const msg = err.code?.replace('auth/', '').replace(/-/g, ' ') || err.message || 'Something went wrong'
      setError(msg.charAt(0).toUpperCase() + msg.slice(1))
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setError('')
    try {
      await loginWithGoogle()
      navigate('/')
    } catch (err) {
      console.error('Google sign-in error:', err)
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(`Google: ${err.message || err.code || 'Unknown error'}`)
      }
    }
  }

  const handleApple = async () => {
    setError('')
    try {
      await loginWithApple()
      navigate('/')
    } catch (err) {
      console.error('Apple sign-in error:', err)
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(`Apple: ${err.message || err.code || 'Unknown error'}`)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top area with branding */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
          <Icon name="play" size={28} className="text-white ml-1" />
        </div>
        <h1 className="text-white text-[32px] font-semibold tracking-tight mb-2">Narrative</h1>
        <p className="text-white/40 text-[16px] text-center">Interactive stories that respond to you</p>
      </div>

      {/* Auth form */}
      <div className="px-6 pb-[max(env(safe-area-inset-bottom),24px)]">
        {/* Social buttons */}
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={handleApple}
            className="flex-1 h-[52px] rounded-2xl bg-white text-black font-semibold text-[16px] cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.96] flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Apple
          </button>
          <button
            type="button"
            onClick={handleGoogle}
            className="flex-1 h-[52px] rounded-2xl bg-white text-black font-semibold text-[16px] cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.96] flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
            Google
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-[14px]">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full h-[48px] px-4 rounded-xl bg-white/10 text-white text-[16px] placeholder-white/30 outline-none mb-3 transition-colors duration-200 focus:bg-white/15"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full h-[48px] px-4 rounded-xl bg-white/10 text-white text-[16px] placeholder-white/30 outline-none mb-3 transition-colors duration-200 focus:bg-white/15"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full h-[48px] px-4 rounded-xl bg-white/10 text-white text-[16px] placeholder-white/30 outline-none mb-4 transition-colors duration-200 focus:bg-white/15"
          />

          {error && (
            <p className="text-red-400 text-[14px] text-center mb-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] rounded-2xl bg-white text-black font-semibold text-[16px] cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.96] disabled:opacity-50 mb-4"
          >
            {loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-center text-[16px] text-white/40 mb-4">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            className="text-white font-medium cursor-pointer"
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}
