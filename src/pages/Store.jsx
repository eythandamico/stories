import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameState } from '../lib/use-game-state.js'
import { hapticLight, hapticSuccess } from '../lib/haptics.js'
import Icon from '../lib/icon.jsx'
import { HeartIcon } from '../components/heart-icon.jsx'

const bundles = [
  { id: 'small', hearts: 3, price: 0.99, label: '3 Hearts', popular: false },
  { id: 'medium', hearts: 10, price: 2.99, label: '10 Hearts', popular: true, save: '40%' },
  { id: 'large', hearts: 25, price: 4.99, label: '25 Hearts', popular: false, save: '60%' },
  { id: 'unlimited', hearts: 999, price: 9.99, label: 'Unlimited', subtitle: 'For 30 days', popular: false, icon: 'sparkle' },
]

const perkBundles = [
  { id: 'freeze-3', type: 'freeze', count: 3, price: 0.99, label: '3x Freeze Time', icon: 'clock', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  { id: 'hint-3', type: 'hint', count: 3, price: 0.99, label: '3x Hint', icon: 'sparkle', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { id: 'rewind-3', type: 'rewind', count: 3, price: 0.99, label: '3x Rewind', icon: 'rotate-ccw', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { id: 'perk-pack', type: 'pack', count: 5, price: 1.99, label: 'Variety Pack', subtitle: '5 of each perk', icon: 'sparkle', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', popular: true },
]

async function requestPayment(bundle) {
  if (!window.PaymentRequest) return { success: false, fallback: true }
  const methods = [
    { supportedMethods: 'https://apple.com/apple-pay', data: { version: 3, merchantIdentifier: 'merchant.com.narrative.app', merchantCapabilities: ['supports3DS'], supportedNetworks: ['visa', 'masterCard', 'amex'], countryCode: 'US' } },
    { supportedMethods: 'basic-card' },
  ]
  const details = {
    total: { label: bundle.label, amount: { currency: 'USD', value: bundle.price.toFixed(2) } },
  }
  try {
    const request = new PaymentRequest(methods, details)
    if (!(await request.canMakePayment())) return { success: false, fallback: true }
    const response = await request.show()
    await response.complete('success')
    return { success: true }
  } catch (err) {
    if (err.name === 'AbortError') return { success: false, cancelled: true }
    return { success: false, fallback: true }
  }
}

export default function Store() {
  const navigate = useNavigate()
  const { hearts, purchaseHearts, purchasePerks, perks } = useGameState()
  const [purchasing, setPurchasing] = useState(null)

  const handleBuy = async (bundle) => {
    hapticLight()
    setPurchasing(bundle.id)
    const result = await requestPayment(bundle)
    if (result.success || result.fallback) {
      hapticSuccess()
      purchaseHearts(bundle.hearts)
    }
    setPurchasing(null)
  }

  const handleBuyPerk = async (perk) => {
    hapticLight()
    setPurchasing(perk.id)
    const result = await requestPayment({ label: perk.label, price: perk.price })
    if (result.success || result.fallback) {
      hapticSuccess()
      if (perk.type === 'pack') {
        purchasePerks('freeze', 5)
        purchasePerks('hint', 5)
        purchasePerks('rewind', 5)
      } else {
        purchasePerks(perk.type, perk.count)
      }
    }
    setPurchasing(null)
  }

  return (
    <main className="min-h-[100dvh] bg-[var(--inv-bg)] pb-28 animate-page-enter">
      {/* Header */}
      <div className="px-5 pt-[calc(env(safe-area-inset-top,20px)+20px)] pb-2">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors duration-150 hover:bg-[var(--inv-nav-hover-bg)] active:scale-[0.96]"
            aria-label="Go back"
          >
            <Icon name="arrow-left" size={20} className="text-[var(--inv-heading)]" />
          </button>
          <h1 className="inv-title flex-1">Store</h1>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--inv-bg-alt)]">
            <HeartIcon size={20} />
            <span className="text-[16px] font-semibold text-[var(--inv-heading)] tabular-nums">{hearts}</span>
          </div>
        </div>
      </div>

      <div className="px-6">
        {/* Hearts section */}
        <p className="text-[14px] font-medium text-[var(--inv-muted)] tracking-widest uppercase mb-3 animate-fade-up">Hearts</p>
        <div className="flex flex-col gap-2.5 mb-8">
          {bundles.map((bundle, idx) => (
            <button
              key={bundle.id}
              type="button"
              onClick={() => handleBuy(bundle)}
              disabled={purchasing !== null}
              className={`animate-fade-up relative w-full p-4 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center gap-3 ${
                bundle.popular ? 'bg-pink-500/10 hover:bg-pink-500/15' : 'bg-[var(--inv-surface)] hover:opacity-80'
              } ${purchasing === bundle.id ? 'opacity-60' : ''}`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {bundle.popular && (
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-pink-500 text-white text-[12px] font-semibold">
                  Best Value
                </span>
              )}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                bundle.popular ? 'bg-pink-500/15' : 'bg-[var(--inv-bg-alt)]'
              }`}>
                {bundle.icon ? <Icon name={bundle.icon} size={22} className="text-pink-400" /> : <HeartIcon size={28} />}
              </div>
              <div className="flex-1 text-left">
                <p className="text-[16px] font-semibold text-[var(--inv-heading)]">
                  {bundle.label}
                  {bundle.save && <span className="ml-2 text-[12px] text-pink-400 font-medium">Save {bundle.save}</span>}
                </p>
                {bundle.subtitle && <p className="text-[14px] text-[var(--inv-muted)]">{bundle.subtitle}</p>}
              </div>
              <span className="text-[16px] font-semibold text-[var(--inv-heading)]">${bundle.price.toFixed(2)}</span>
            </button>
          ))}
        </div>

        {/* Perks section */}
        <p className="text-[14px] font-medium text-[var(--inv-muted)] tracking-widest uppercase mb-3 animate-fade-up" style={{ animationDelay: '0.2s' }}>Power-Ups</p>

        {/* Current perks */}
        <div className="flex gap-3 mb-4 animate-fade-up" style={{ animationDelay: '0.22s' }}>
          {[
            { label: 'Freeze', count: perks.freeze, color: '#38bdf8', icon: 'clock' },
            { label: 'Hint', count: perks.hint, color: '#a78bfa', icon: 'sparkle' },
            { label: 'Rewind', count: perks.rewind, color: '#34d399', icon: 'rotate-ccw' },
          ].map((p) => (
            <div key={p.label} className="flex-1 p-3 rounded-xl bg-[var(--inv-surface)] text-center">
              <Icon name={p.icon} size={18} style={{ color: p.color }} className="mx-auto mb-1" />
              <p className="text-[18px] font-semibold text-[var(--inv-heading)] tabular-nums">{p.count}</p>
              <p className="text-[12px] text-[var(--inv-muted)]">{p.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 mb-6">
          {perkBundles.map((perk, idx) => (
            <button
              key={perk.id}
              type="button"
              onClick={() => handleBuyPerk(perk)}
              disabled={purchasing !== null}
              className={`animate-fade-up relative w-full p-3.5 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center gap-3 ${
                perk.popular ? 'bg-yellow-500/8 hover:bg-yellow-500/12' : 'bg-[var(--inv-surface)] hover:opacity-80'
              } ${purchasing === perk.id ? 'opacity-60' : ''}`}
              style={{ animationDelay: `${0.25 + idx * 0.05}s` }}
            >
              {perk.popular && (
                <span className="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-yellow-500 text-black text-[12px] font-semibold">
                  Best Deal
                </span>
              )}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: perk.bg }}>
                <Icon name={perk.icon} size={20} style={{ color: perk.color }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[16px] font-semibold text-[var(--inv-heading)]">{perk.label}</p>
                {perk.subtitle && <p className="text-[14px] text-[var(--inv-muted)]">{perk.subtitle}</p>}
              </div>
              <span className="text-[16px] font-semibold text-[var(--inv-heading)]">${perk.price.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
