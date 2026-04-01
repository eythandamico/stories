import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile } from 'firebase/auth'
import { auth } from '../lib/firebase.js'
import Icon from '../lib/icon.jsx'

export default function SetupUsername() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    try {
      await updateProfile(auth.currentUser, { displayName: username.trim() })
      localStorage.setItem('narrative-username-set', 'true')
      navigate('/')
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-sm">
        <h1 className="text-white text-[28px] font-semibold tracking-tight text-center mb-2">Pick a username</h1>
        <p className="text-white/40 text-[16px] text-center mb-8">This is how others will see you</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
            maxLength={20}
            autoFocus
            className="w-full h-[52px] px-5 rounded-2xl bg-white/10 text-white text-[18px] text-center placeholder-white/30 outline-none mb-6 transition-colors duration-200 focus:bg-white/15"
          />

          <button
            type="submit"
            disabled={!username.trim() || loading}
            className="w-full h-[52px] rounded-2xl bg-white text-black font-semibold text-[16px] cursor-pointer transition-[opacity,transform] duration-200 active:scale-[0.96] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { localStorage.setItem('narrative-username-set', 'true'); navigate('/') }}
          className="w-full mt-3 text-white/30 text-[16px] cursor-pointer py-2"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
