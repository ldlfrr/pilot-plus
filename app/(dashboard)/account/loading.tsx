export default function AccountLoading() {
  return (
    <div className="flex flex-col min-h-0 h-full">

      {/* Top bar */}
      <div className="h-14 border-b border-white/5 bg-[var(--bg-surface)] flex items-center px-4 md:px-6 flex-shrink-0">
        <div className="space-y-1.5">
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton h-3 w-44 rounded" />
        </div>
      </div>

      <div className="flex flex-1 min-h-0">

        {/* Left nav skeleton */}
        <aside className="hidden md:flex flex-col w-52 border-r border-white/5 flex-shrink-0 py-4 gap-1 px-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg skeleton" />
          ))}
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* Profile banner */}
          <div className="border-b border-white/5 bg-[var(--bg-surface)] px-5 md:px-8 py-5">
            <div className="flex items-center gap-4">
              <div className="skeleton w-16 h-16 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-3 w-52 rounded" />
                <div className="skeleton h-3 w-32 rounded" />
              </div>
            </div>
          </div>

          {/* Form cards */}
          <div className="p-5 md:p-8 space-y-5 max-w-2xl">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
                <div className="skeleton h-3 w-24 rounded mb-5" />
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: i === 0 ? 5 : 2 }).map((_, j) => (
                    <div key={j} className={i === 0 && j === 4 ? 'col-span-2 space-y-1.5' : 'space-y-1.5'}>
                      <div className="skeleton h-3 w-20 rounded" />
                      <div className="skeleton h-10 w-full rounded-xl" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
