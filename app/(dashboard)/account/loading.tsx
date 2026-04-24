export default function AccountLoading() {
  return (
    <div className="flex flex-col min-h-0">

      {/* Top bar skeleton */}
      <div className="h-14 border-b border-white/5 bg-[#13161e] flex items-center px-4 md:px-6 flex-shrink-0">
        <div className="space-y-1.5">
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton h-3 w-44 rounded" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-2xl w-full mx-auto">

        {/* Profile card */}
        <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-5">
          <div className="skeleton h-3 w-12 rounded mb-4" />
          <div className="flex items-center gap-4 mb-6">
            <div className="skeleton w-[72px] h-[72px] rounded-full flex-shrink-0" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-40 rounded" />
              <div className="skeleton h-4 w-16 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <div className="mt-5">
            <div className="skeleton h-9 w-32 rounded-lg" />
          </div>
        </div>

        {/* Theme card */}
        <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-5">
          <div className="skeleton h-3 w-20 rounded mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Security card */}
        <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-5">
          <div className="skeleton h-3 w-16 rounded mb-4" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="skeleton w-8 h-8 rounded-lg" />
              <div className="space-y-1.5">
                <div className="skeleton h-4 w-28 rounded" />
                <div className="skeleton h-3 w-36 rounded" />
              </div>
            </div>
            <div className="skeleton h-9 w-48 rounded-lg" />
          </div>
        </div>

        {/* Subscription card */}
        <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-5">
          <div className="skeleton h-3 w-24 rounded mb-4" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="skeleton w-8 h-8 rounded-lg" />
              <div className="space-y-1.5">
                <div className="skeleton h-4 w-28 rounded" />
                <div className="skeleton h-4 w-16 rounded-full" />
              </div>
            </div>
            <div className="skeleton h-9 w-20 rounded-lg" />
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-[#1a1d2e] border border-red-500/20 rounded-xl p-5">
          <div className="skeleton h-3 w-24 rounded mb-4" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="skeleton w-8 h-8 rounded-lg" />
              <div className="space-y-1.5">
                <div className="skeleton h-4 w-36 rounded" />
                <div className="skeleton h-3 w-56 rounded" />
              </div>
            </div>
            <div className="skeleton h-9 w-28 rounded-lg" />
          </div>
        </div>

      </div>
    </div>
  )
}
