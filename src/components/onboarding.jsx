import { useState } from 'react'
import Icon from '../lib/icon.jsx'
import { HeartIcon } from './heart-icon.jsx'
import { FlameIcon } from './flame-icon.jsx'

const STORAGE_KEY = 'narrative-onboarding-complete'

const steps = [
  {
    video: 'https://pub-2c7d56fe4c98425381098ff8d4dfabe4.r2.dev/previews/onboarding-1.mp4',
    title: 'Watch',
    description: 'Immerse yourself in cinematic stories crafted just for you',
    icon: 'play',
  },
  {
    video: 'https://pub-2c7d56fe4c98425381098ff8d4dfabe4.r2.dev/previews/onboarding-2.mp4',
    title: 'Choose',
    description: 'Your decisions shape the narrative — every choice matters',
    icon: 'target',
  },
  {
    video: 'https://pub-2c7d56fe4c98425381098ff8d4dfabe4.r2.dev/previews/onboarding-3.mp4',
    title: 'Discover',
    description: 'Unlock endings, build streaks, and collect every path',
    icon: 'sparkle',
  },
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
      className="fixed inset-0 z-[60] bg-black flex flex-col"
      onClick={!isLast ? advance : undefined}
    >
      {/* Video background */}
      <video
        key={step}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src={current.video} type="video/mp4" />
      </video>

      {/* Progressive blur */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          maskImage: 'linear-gradient(to top, black 0%, black 35%, transparent 65%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, black 35%, transparent 65%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)' }}
      />

      {/* Skip button */}
      {!isLast && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); finish() }}
          className="absolute z-10 text-white/40 text-[15px] font-medium cursor-pointer"
          style={{ top: 'calc(env(safe-area-inset-top, 20px) + 16px)', right: 20 }}
        >
          Skip
        </button>
      )}

      {/* Bottom content */}
      <div className="relative flex-1 flex flex-col justify-end px-8 pb-[max(env(safe-area-inset-bottom),24px)]">
        <div key={step} className="animate-fade-up text-center mb-8">
          <h2 className="text-white font-semibold text-[34px] tracking-tight mb-3">{current.title}</h2>
          <p className="text-white/50 text-[17px] leading-relaxed max-w-[300px] mx-auto">{current.description}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
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

        {/* Button */}
        {isLast ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); finish() }}
            className="w-full h-[52px] rounded-2xl bg-white text-black font-semibold text-[16px] cursor-pointer transition-all duration-200 active:scale-[0.97] animate-fade-up"
          >
            Get Started
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); advance() }}
            className="w-full h-[52px] rounded-2xl bg-white/15 backdrop-blur-md text-white font-semibold text-[16px] cursor-pointer transition-all duration-200 active:scale-[0.97]"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}
