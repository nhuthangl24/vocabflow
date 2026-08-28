export default function Loading() {
  return (
    <div className="p-4 sm:p-5 w-full mx-auto h-full flex flex-col animate-pulse">
      <div className="mb-6">
        <div className="w-32 h-4 bg-slate-200 dark:bg-neutral-800 rounded mb-4"></div>
        <div className="w-64 h-8 bg-slate-200 dark:bg-neutral-800 rounded-lg mb-2"></div>
        <div className="w-96 h-4 bg-slate-200 dark:bg-neutral-800 rounded"></div>
      </div>

      <div className="bg-slate-100/50 dark:bg-[#0a0a0a]/50 rounded-xl border border-slate-200/60 dark:border-neutral-800 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden mt-2">
        <div className="h-12 border-b border-slate-100 dark:border-neutral-800 flex items-center px-4 shrink-0 bg-slate-50/50 dark:bg-[#0a0a0a]/50">
          <div className="w-full max-w-md h-8 bg-slate-200 dark:bg-neutral-800 rounded-lg"></div>
        </div>

        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="aspect-video bg-slate-200 dark:bg-neutral-800 rounded-xl"></div>
                <div className="w-full h-4 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                <div className="w-2/3 h-4 bg-slate-200 dark:bg-neutral-800 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
