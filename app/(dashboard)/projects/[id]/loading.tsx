export default function ProjectLoading() {
  return (
    <div className="flex flex-col min-h-0 animate-pulse">

      {/* Header skeleton */}
      <div className="bg-[#13161e] border-b border-white/5 px-4 md:px-6 py-4 flex-shrink-0">
        <div className="flex flex-col gap-3 mb-4">
          {/* Title row */}
          <div className="flex items-center gap-3">
            <div className="h-6 w-56 bg-white/8 rounded-lg" />
            <div className="h-5 w-16 bg-white/5 rounded-full" />
            <div className="h-5 w-12 bg-white/5 rounded-md" />
          </div>
          {/* Meta row */}
          <div className="flex items-center gap-3">
            <div className="h-3.5 w-24 bg-white/5 rounded" />
            <div className="h-3.5 w-20 bg-white/5 rounded" />
            <div className="h-3.5 w-32 bg-white/5 rounded" />
          </div>
          {/* Action buttons row */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-24 bg-white/5 rounded-lg" />
            <div className="h-7 w-20 bg-white/5 rounded-lg" />
            <div className="h-7 w-20 bg-white/5 rounded-lg" />
            <div className="h-7 w-20 bg-blue-600/20 rounded-lg" />
            <div className="h-7 w-20 bg-emerald-600/20 rounded-lg" />
            <div className="h-7 w-7 bg-white/5 rounded-lg" />
            <div className="h-7 w-7 bg-white/5 rounded-lg" />
          </div>
        </div>
        {/* Tabs row */}
        <div className="flex gap-0.5">
          {[80, 64, 48, 96, 112, 88, 72, 72, 80].map((w, i) => (
            <div key={i} className="h-9 rounded-sm bg-white/5" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-white/4 rounded-xl border border-white/6" />
          ))}
        </div>
        <div className="h-48 bg-white/4 rounded-xl border border-white/6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-36 bg-white/4 rounded-xl border border-white/6" />
          <div className="h-36 bg-white/4 rounded-xl border border-white/6" />
        </div>
      </div>
    </div>
  )
}
