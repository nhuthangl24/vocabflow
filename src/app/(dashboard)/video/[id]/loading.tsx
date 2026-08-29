import { BookOpen } from "lucide-react";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <div className="w-48 h-8 bg-slate-200 dark:bg-neutral-800 rounded-lg mb-4"></div>
          <div className="flex items-start justify-between gap-4">
            <div className="w-1/3 h-8 bg-slate-200 dark:bg-neutral-800 rounded-lg"></div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8 w-full mt-6">
        <div className="w-full">
          {/* Tabs */}
          <div className="flex space-x-4 border-b border-gray-200 dark:border-neutral-700 mb-6">
            <div className="w-24 h-10 bg-slate-200 dark:bg-neutral-800 rounded-t-lg"></div>
            <div className="w-28 h-10 bg-slate-200 dark:bg-neutral-800 rounded-t-lg"></div>
          </div>

          <div className="w-full bg-white dark:bg-[#0a0a0a] rounded-lg shadow border border-gray-200 dark:border-neutral-700">
            <div className="p-4 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-[#0a0a0a] rounded-t-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="w-48 h-6 bg-slate-200 dark:bg-neutral-800 rounded-md"></div>
              
              <div className="flex space-x-2">
                <div className="w-16 h-8 bg-slate-200 dark:bg-neutral-800 rounded-md"></div>
                <div className="w-20 h-8 bg-slate-200 dark:bg-neutral-800 rounded-md"></div>
                <div className="w-24 h-8 bg-slate-200 dark:bg-neutral-800 rounded-md"></div>
                <div className="w-20 h-8 bg-slate-200 dark:bg-neutral-800 rounded-md"></div>
              </div>
            </div>
            
            <div className="p-4 space-y-8">
              <div>
                <div className="w-32 h-6 bg-slate-200 dark:bg-neutral-800 rounded-md mb-4 border-b pb-2"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="p-4 rounded-xl border-2 border-gray-100 dark:border-neutral-800 h-36 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="w-24 h-6 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                          <div className="w-10 h-5 bg-slate-200 dark:bg-neutral-800 rounded-full"></div>
                        </div>
                        <div className="w-full h-4 bg-slate-100 dark:bg-neutral-900 rounded mb-2 mt-3"></div>
                        <div className="w-4/5 h-4 bg-slate-100 dark:bg-neutral-900 rounded"></div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="w-12 h-3 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                        <div className="w-20 h-6 bg-slate-200 dark:bg-neutral-800 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
