import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { sendMagicLink, isEmailLink, completeEmailSignIn, loginWithGoogle, loginWithApple } from '../lib/firebase.js'
import Icon from '../lib/icon.jsx'

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [view, setView] = useState('main') // 'main' | 'email' | 'check-email'
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(null)
  const videoRef = useRef(null)

  // Handle magic link callback
  useEffect(() => {
    if (searchParams.get('finishSignIn') && isEmailLink(window.location.href)) {
      setLoading(true)
      completeEmailSignIn(window.location.href)
        .then(() => navigate('/'))
        .catch((err) => {
          setError(err.message || 'Sign in failed — try again')
          setLoading(false)
        })
    }
  }, [])

  const handleSendLink = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    setLoading(true)
    try {
      await sendMagicLink(email.trim())
      setView('check-email')
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
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign in failed')
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
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Apple sign in failed')
      }
    }
    setSocialLoading(null)
  }

  // Completing magic link sign-in
  if (loading && searchParams.get('finishSignIn')) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin mb-4" />
        <p className="text-white/60 text-[16px]">Signing you in...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Video background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay loop muted playsInline preload="auto"
      >
        <source src="https://pub-2c7d56fe4c98425381098ff8d4dfabe4.r2.dev/previews/auth-bg.mp4" type="video/mp4" />
      </video>

      {/* Progressive blur */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        maskImage: 'linear-gradient(to top, black 0%, black 50%, transparent 80%)',
        WebkitMaskImage: 'linear-gradient(to top, black 0%, black 50%, transparent 80%)',
      }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 80%, transparent 100%)' }}
      />

      {/* Centered content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Branding */}
        {view !== 'check-email' && (
          <div className="text-center mb-10">
            <h1 className="text-white text-[38px] font-semibold tracking-tight mb-2">Narrative</h1>
            <p className="text-white/50 text-[16px]">Interactive stories that respond to you</p>
          </div>
        )}

        {error && <p className="text-red-400 text-[14px] text-center mb-4">{error}</p>}

        {view === 'check-email' ? (
          /* Check email view */
          <div className="text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-5">
              <Icon name="mail" size={28} className="text-white" />
            </div>
            <h2 className="text-white text-[24px] font-semibold mb-2">Check your inbox</h2>
            <p className="text-white/50 text-[16px] leading-relaxed mb-6">
              We sent a sign-in link to<br />
              <span className="text-white/70 font-medium">{email}</span>
            </p>
            <button
              type="button"
              onClick={() => { setView('main'); setEmail(''); setError('') }}
              className="text-white/40 text-[15px] cursor-pointer"
            >
              Use a different method
            </button>
          </div>
        ) : (
          /* Main view — social + email input */
          <div className="flex flex-col gap-2.5 w-full">
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

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/25 text-[13px]">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Email input with inline send button */}
            <form onSubmit={handleSendLink} className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full h-[50px] px-4 pr-14 rounded-xl bg-white/10 text-white text-[16px] placeholder-white/30 outline-none transition-colors duration-200 focus:bg-white/15"
              />
              {email.trim() && (
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-white flex items-center justify-center cursor-pointer active:scale-[0.94] disabled:opacity-50 transition-[opacity,transform] duration-150"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
                  ) : (
                    <Icon name="arrow-right" size={16} className="text-black" />
                  )}
                </button>
              )}
            </form>

            <p className="text-white/25 text-[12px] text-center leading-relaxed mt-4">
              By continuing, you agree to our{' '}
              <span onClick={() => navigate('/terms')} className="text-white/40 underline cursor-pointer">Terms of Service</span>
              {' '}and{' '}
              <span onClick={() => navigate('/privacy')} className="text-white/40 underline cursor-pointer">Privacy Policy</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
