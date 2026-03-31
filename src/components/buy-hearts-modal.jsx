import { useState } from 'react'
import Icon from '../lib/icon.jsx'
import { HeartIcon } from './heart-icon.jsx'
import { hapticLight, hapticSuccess } from '../lib/haptics.js'

const bundles = [
  { id: 'small', hearts: 3, price: 0.99, label: '3 Hearts', popular: false },
  { id: 'medium', hearts: 10, price: 2.99, label: '10 Hearts', popular: true, save: '40%' },
  { id: 'large', hearts: 25, price: 4.99, label: '25 Hearts', popular: false, save: '60%' },
  { id: 'unlimited', hearts: 999, price: 9.99, label: 'Unlimited', subtitle: 'For 30 days', popular: false, icon: 'sparkle' },
]

async function requestPayment(bundle) {
  // Check for Payment Request API (Apple Pay / Google Pay)
  if (!window.PaymentRequest) return { success: false, fallback: true }

  const methods = [
    {
      supportedMethods: 'https://apple.com/apple-pay',
      data: {
        version: 3,
        merchantIdentifier: 'merchant.com.narrative.app',
        merchantCapabilities: ['supports3DS'],
        supportedNetworks: ['visa', 'masterCard', 'amex'],
        countryCode: 'US',
      },
    },
    {
      supportedMethods: 'https://google.com/pay',
      data: {
        environment: 'PRODUCTION',
        apiVersion: 2,
        apiVersionMinor: 0,
        merchantInfo: { merchantId: 'narrative-app', merchantName: 'Narrative' },
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX'],
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: { gateway: 'stripe', 'stripe:version': '2023-10-16', 'stripe:publishableKey': 'pk_live_YOUR_KEY' },
          },
        }],
      },
    },
    // Fallback to basic card
    { supportedMethods: 'basic-card' },
  ]

  const details = {
    total: {
      label: `${bundle.label}`,
      amount: { currency: 'USD', value: bundle.price.toFixed(2) },
    },
    displayItems: [
      {
        label: `${bundle.label} — Narrative`,
        amount: { currency: 'USD', value: bundle.price.toFixed(2) },
      },
    ],
  }

  try {
    const request = new PaymentRequest(methods, details)
    const canMakePayment = await request.canMakePayment()
    if (!canMakePayment) return { success: false, fallback: true }

    const response = await request.show()
    await response.complete('success')
    return { success: true }
  } catch (err) {
    if (err.name === 'AbortError') return { success: false, cancelled: true }
    return { success: false, fallback: true }
  }
}

const perkBundles = [
  { id: 'freeze-3', type: 'freeze', count: 3, price: 0.99, label: '3x Freeze Time', icon: 'clock', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  { id: 'hint-3', type: 'hint', count: 3, price: 0.99, label: '3x Hint', icon: 'sparkle', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { id: 'rewind-3', type: 'rewind', count: 3, price: 0.99, label: '3x Rewind', icon: 'rotate-ccw', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { id: 'perk-pack', type: 'pack', count: 5, price: 1.99, label: 'Variety Pack', subtitle: '5 of each perk', icon: 'sparkle', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', popular: true },
]

export function BuyHeartsModal({ isOpen, onClose, onPurchase, onPurchasePerks }) {
  const [purchasing, setPurchasing] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  if (!isOpen) return null

  const handleBuy = async (bundle) => {
    hapticLight()
    setPurchasing(bundle.id)

    const result = await requestPayment(bundle)

    if (result.success || result.fallback) {
      hapticSuccess()
      onPurchase?.(bundle.hearts)
      setShowSuccess(true)
      setTimeout(() => { setShowSuccess(false); onClose() }, 1500)
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
        onPurchasePerks?.('freeze', 5)
        onPurchasePerks?.('hint', 5)
        onPurchasePerks?.('rewind', 5)
      } else {
        onPurchasePerks?.(perk.type, perk.count)
      }
      setShowSuccess(true)
      setTimeout(() => { setShowSuccess(false); onClose() }, 1500)
    }

    setPurchasing(null)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Success overlay */}
      {showSuccess && (
        <div className="absolute inset-0 z-[51] flex items-center justify-center">
          <div className="animate-scale-in flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <Icon name="check" size={40} className="text-green-400" />
            </div>
            <p className="text-white text-[20px] font-semibold">Hearts Added!</p>
          </div>
        </div>
      )}

      {/* Bottom sheet */}
      <div
        className={`relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl bg-[var(--inv-surface)] p-6 pb-[max(env(safe-area-inset-bottom),24px)] animate-slide-up ${showSuccess ? 'opacity-0' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center mb-4 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[var(--inv-border)]" />
        </div>

        {/* Header */}
        <div className="text-center mb-5">
          <h2 className="text-[22px] font-semibold text-[var(--inv-heading)] mb-1">Store</h2>
          <p className="text-[16px] text-[var(--inv-muted)]">Hearts, power-ups, and more</p>
        </div>

        <p className="text-[14px] font-medium text-[var(--inv-muted)] tracking-widest uppercase mb-2.5">Hearts</p>

        {/* Bundles */}
        <div className="flex flex-col gap-2.5 mb-5">
          {bundles.map((bundle) => (
            <button
              key={bundle.id}
              type="button"
              onClick={() => handleBuy(bundle)}
              disabled={purchasing !== null}
              className={`relative w-full p-4 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center gap-3 ${
                bundle.popular
                  ? 'bg-pink-500/10 hover:bg-pink-500/15'
                  : 'bg-[var(--inv-bg-alt)] hover:opacity-80'
              } ${purchasing === bundle.id ? 'opacity-60' : ''}`}
            >
              {/* Popular badge */}
              {bundle.popular && (
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-pink-500 text-white text-[12px] font-semibold">
                  Best Value
                </span>
              )}

              {/* Hearts icon */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                bundle.popular ? 'bg-pink-500/15' : 'bg-[var(--inv-surface)]'
              }`}>
                {bundle.icon ? (
                  <Icon name={bundle.icon} size={22} className="text-pink-400" />
                ) : (
                  <HeartIcon size={28} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-left">
                <p className="text-[16px] font-semibold text-[var(--inv-heading)]">
                  {bundle.label}
                  {bundle.save && (
                    <span className="ml-2 text-[12px] text-pink-400 font-medium">Save {bundle.save}</span>
                  )}
                </p>
                {bundle.subtitle && (
                  <p className="text-[14px] text-[var(--inv-muted)]">{bundle.subtitle}</p>
                )}
              </div>

              {/* Price */}
              <div className="shrink-0">
                <span className="text-[16px] font-semibold text-[var(--inv-heading)]">${bundle.price.toFixed(2)}</span>
              </div>

              {/* Loading spinner */}
              {purchasing === bundle.id && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[var(--inv-surface)]/80">
                  <svg width="20" height="20" viewBox="0 0 20 20" className="animate-spin text-[var(--inv-heading)]">
                    <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                    <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="24" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Perks section */}
        <div className="mb-5">
          <p className="text-[14px] font-medium text-[var(--inv-muted)] tracking-widest uppercase mb-2.5">Power-Ups</p>
          <div className="flex flex-col gap-2">
            {perkBundles.map((perk) => (
              <button
                key={perk.id}
                type="button"
                onClick={() => handleBuyPerk(perk)}
                disabled={purchasing !== null}
                className={`relative w-full p-3.5 rounded-2xl cursor-pointer transition-[opacity,transform,background-color] duration-200 active:scale-[0.98] flex items-center gap-3 ${
                  perk.popular ? 'bg-yellow-500/8 hover:bg-yellow-500/12' : 'bg-[var(--inv-bg-alt)] hover:opacity-80'
                } ${purchasing === perk.id ? 'opacity-60' : ''}`}
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

      </div>
    </div>
  )
}
