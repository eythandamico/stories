import { useState } from 'react'
import Icon from '../lib/icon.jsx'

const STORAGE_KEY = 'narrative-onboarding-complete'

const steps = [
  { icon: 'play', color: 'text-white', title: 'Watch', description: 'Immerse yourself in cinematic stories' },
  { icon: 'target', color: 'text-white', title: 'Choose', description: 'Your decisions shape the story' },
  { icon: 'heart', color: 'text-pink-400', fill: true, title: 'Connect', description: 'Build relationships and discover every ending' },
]

export function shouldShowOnboarding() {
  return !localStorage.getItem(STORAGE_KEY)
}

export function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)

  const advance = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1)
    }
  }

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    onComplete()
  }

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div
      className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center px-10"
      onClick={!isLast ? advance : undefined}
    >
      {/* Step content */}
      <div key={step} className="animate-fade-up flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-8">
          <Icon
            name={current.icon}
            size={44}
            className={current.color}
            style={current.fill ? { fill: 'currentColor' } : undefined}
          />
        </div>
        <h2 className="text-white font-semibold text-[32px] tracking-tight mb-3">{current.title}</h2>
        <p className="text-white/45 text-[16px] leading-relaxed max-w-[280px]">{current.description}</p>
      </div>

      {/* Bottom area */}
      <div className="absolute bottom-16 left-0 right-0 px-10 flex flex-col items-center gap-6">
        {/* Progress dots */}
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-500"
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                backgroundColor: i === step ? 'white' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>

        {/* Button on last step */}
        {isLast && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); finish() }}
            className="w-full h-[52px] rounded-2xl bg-white text-black font-semibold text-[16px] cursor-pointer transition-all duration-200 active:scale-[0.97] animate-fade-up"
          >
            Get Started
          </button>
        )}

        {!isLast && (
          <p className="text-white/25 text-[16px]">Tap to continue</p>
        )}
      </div>
    </div>
  )
}
