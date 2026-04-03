import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithEmail, signupWithEmail, loginWithGoogle, loginWithApple } from '../lib/firebase.js'

export default function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(null) // 'google' | 'apple'
  const videoRef = useRef(null)

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
    setSocialLoading('google')
    try {
      await loginWithGoogle()
      navigate('/')
    } catch (err) {
      console.error('Google sign-in error:', err)
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(`Google: ${err.message || err.code || 'Unknown error'}`)
      }
    }
    setSocialLoading(null)
  }

  const handleApple = async () => {
    setError('')
    setSocialLoading('apple')
    try {
      await loginWithApple()
      navigate('/')
    } catch (err) {
      console.error('Apple sign-in error:', err)
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(`Apple: ${err.message || err.code || 'Unknown error'}`)
      }
    }
    setSocialLoading(null)
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Video background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster=""
      >
        <source src="https://pub-2c7d56fe4c98425381098ff8d4dfabe4.r2.dev/previews/auth-bg.mp4" type="video/mp4" />
      </video>

      {/* Progressive blur overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          maskImage: 'linear-gradient(to top, black 0%, black 50%, transparent 80%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, black 50%, transparent 80%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 80%, transparent 100%)' }}
      />

      {/* Top branding */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-8 z-10">
        <h1 className="text-white text-[38px] font-semibold tracking-tight mb-2">Narrative</h1>
        <p className="text-white/50 text-[16px] text-center">Interactive stories that respond to you</p>
      </div>

      {/* Auth form */}
      <div className="relative z-10 px-6 pb-[max(env(safe-area-inset-bottom),24px)]">

        {error && (
          <p className="text-red-400 text-[14px] text-center mb-4">{error}</p>
        )}

        {/* Email form */}
        <form onSubmit={handleSubmit} className="mb-4">
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
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[50px] rounded-xl bg-white/15 backdrop-blur-md text-white font-semibold text-[16px] cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.97] disabled:opacity-50"
          >
            {loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : 'Sign In with Email'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-[13px]">or continue with</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Social buttons — stacked, official style */}
        <div className="flex flex-col gap-2.5 mb-5">
          <button
            type="button"
            onClick={handleApple}
            disabled={socialLoading !== null}
            className="w-full h-[50px] rounded-xl bg-white text-black font-semibold text-[16px] cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.97] disabled:opacity-60 flex items-center justify-center gap-2.5"
          >
            {socialLoading === 'apple' ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                Continue with Apple
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={socialLoading !== null}
            className="w-full h-[50px] rounded-xl bg-white text-black font-semibold text-[16px] cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.97] disabled:opacity-60 flex items-center justify-center gap-2.5"
          >
            {socialLoading === 'google' ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        {/* Toggle mode */}
        <p className="text-center text-[15px] text-white/40">
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
