export default function Loading() {
  return (
    <div className="p-4 sm:p-5 w-full mx-auto animate-pulse">
      
      {/* Page Header */}
      <div className="mb-6">
        <div className="w-32 h-8 bg-slate-200 dark:bg-neutral-800 rounded-lg mb-2"></div>
        <div className="w-48 h-4 bg-slate-200 dark:bg-neutral-800 rounded"></div>
      </div>

      {/* Hero Banner */}
      <div className="w-full h-48 bg-slate-200 dark:bg-neutral-800 rounded-3xl mb-8"></div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-100 dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-neutral-800 p-5 h-28">
                <div className="w-24 h-4 bg-slate-200 dark:bg-neutral-800 rounded mb-4"></div>
                <div className="w-16 h-8 bg-slate-200 dark:bg-neutral-800 rounded"></div>
              </div>
            ))}
          </div>

          {/* Videos Table/List */}
          <div className="bg-slate-100 dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-neutral-800 p-6 min-h-[300px]">
            <div className="flex justify-between items-center mb-6">
              <div className="w-40 h-6 bg-slate-200 dark:bg-neutral-800 rounded"></div>
              <div className="w-20 h-8 bg-slate-200 dark:bg-neutral-800 rounded-full"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-32 h-20 bg-slate-200 dark:bg-neutral-800 rounded-lg shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-3/4 h-5 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                    <div className="w-1/2 h-4 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar (1 Column) */}
        <div className="space-y-6">
          <div className="bg-slate-100 dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-neutral-800 p-6 h-[400px]">
            <div className="w-40 h-6 bg-slate-200 dark:bg-neutral-800 rounded mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-full h-12 bg-slate-200 dark:bg-neutral-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
