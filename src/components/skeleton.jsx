export function FeedSkeleton() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="w-full h-full animate-pulse">
        <div className="w-full h-full bg-white/[0.03]" />
        {/* Bottom content skeleton */}
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-32">
          <div className="w-20 h-5 bg-white/5 rounded-lg mb-3 mx-auto" />
          <div className="w-48 h-10 bg-white/5 rounded-lg mb-3 mx-auto" />
          <div className="w-64 h-4 bg-white/[0.03] rounded-lg mb-2 mx-auto" />
          <div className="w-52 h-4 bg-white/[0.03] rounded-lg mx-auto" />
        </div>
      </div>
    </div>
  )
}

export function ExploreSkeleton() {
  return (
    <main className="min-h-[100dvh] bg-[var(--inv-bg)] pb-28 pt-14 px-6">
      <div className="w-full h-11 bg-[var(--inv-surface)] rounded-2xl mb-6 animate-pulse" />
      {[0, 1, 2].map(i => (
        <div key={i} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-[var(--inv-surface)] rounded animate-pulse" />
            <div className="w-24 h-5 bg-[var(--inv-surface)] rounded animate-pulse" />
          </div>
          <div className="flex gap-3.5 overflow-hidden">
            {[0, 1, 2].map(j => (
              <div key={j} className="shrink-0 w-[160px]">
                <div className="aspect-[3/4] bg-[var(--inv-surface)] rounded-[20px] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  )
}

export function PlayerSkeleton() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
    </div>
  )
}
