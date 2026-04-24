export default function ProjectsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="h-7 w-36 bg-white/8 rounded-lg" />
        <div className="h-8 w-32 bg-blue-600/20 rounded-xl" />
      </div>
      {/* Filters */}
      <div className="flex gap-2">
        {[48, 72, 64, 52].map((w, i) => (
          <div key={i} className="h-8 bg-white/5 rounded-lg" style={{ width: w }} />
        ))}
      </div>
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 bg-white/4 rounded-xl border border-white/6" />
        ))}
      </div>
    </div>
  )
}
