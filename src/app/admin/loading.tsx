export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-neutral-800 rounded-lg" />
          <div className="h-3 w-72 bg-neutral-900 rounded" />
        </div>
        <div className="h-8 w-32 bg-neutral-800 rounded-lg" />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#111] border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-2.5 w-20 bg-neutral-800 rounded" />
              <div className="w-4 h-4 bg-neutral-800 rounded" />
            </div>
            <div className="h-8 w-16 bg-neutral-800 rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-[#111] border border-neutral-800 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="bg-[#151515] border-b border-neutral-800 px-4 py-3 flex gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3 bg-neutral-800 rounded" style={{ width: `${60 + i * 20}px` }} />
          ))}
        </div>

        {/* Table rows */}
        <div className="divide-y divide-neutral-800/50">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-6">
              <div className="h-3 w-20 bg-neutral-900 rounded" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-32 bg-neutral-900 rounded" />
                <div className="h-2.5 w-24 bg-neutral-800/50 rounded" />
              </div>
              <div className="h-3 w-40 bg-neutral-900 rounded" />
              <div className="h-5 w-16 bg-neutral-800 rounded-full" />
              <div className="h-3 w-24 bg-neutral-900 rounded" />
              <div className="ml-auto h-6 w-6 bg-neutral-800 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Centered spinner overlay */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="relative">
          <div className="w-8 h-8 rounded-full border-2 border-neutral-800" />
          <div className="w-8 h-8 rounded-full border-2 border-t-emerald-500 absolute inset-0 animate-spin" />
        </div>
      </div>
    </div>
  );
}
