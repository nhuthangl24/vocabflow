import { Headphones } from "lucide-react";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <div className="w-48 h-8 bg-slate-200 dark:bg-neutral-800 rounded-lg mb-4"></div>
          <div className="flex items-start justify-between gap-4">
            <div className="w-2/3 h-8 bg-slate-200 dark:bg-neutral-800 rounded-lg"></div>
            <div className="shrink-0 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/20">
              <Headphones className="w-4 h-4" />
              <span className="text-sm font-bold tracking-wide">SHADOWING MODE</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8 w-full mt-6">
        <div className="w-full lg:w-6/12 shrink-0">
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-24 h-6 bg-slate-200 dark:bg-neutral-800 rounded-lg"></div>
              <div className="w-32 h-8 bg-slate-200 dark:bg-neutral-800 rounded-full"></div>
            </div>
            <div className="aspect-video bg-slate-200 dark:bg-neutral-800 rounded-2xl w-full"></div>
          </div>
        </div>

        <div className="w-full lg:w-6/12">
          <div className="w-full bg-[#0f0f0f] dark:bg-[#121212] rounded-3xl p-6 min-h-[400px]">
            <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
              <div className="flex space-x-2">
                <div className="w-32 h-10 bg-neutral-800 rounded-lg"></div>
                <div className="w-40 h-10 bg-neutral-800 rounded-lg"></div>
              </div>
              <div className="w-16 h-8 bg-indigo-500/10 rounded-full"></div>
            </div>
            
            <div className="w-full h-40 bg-[#1a1a1a] border border-neutral-800 rounded-2xl mb-4"></div>
            <div className="w-full h-16 bg-[#1a1a1a] border border-neutral-800 rounded-2xl mb-4"></div>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 h-12 bg-neutral-800 rounded-xl"></div>
              <div className="flex-1 h-12 bg-neutral-800 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
