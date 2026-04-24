export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-white/8 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-white/4 rounded-xl border border-white/6" />
        ))}
      </div>
      <div className="h-64 bg-white/4 rounded-xl border border-white/6" />
    </div>
  )
}
