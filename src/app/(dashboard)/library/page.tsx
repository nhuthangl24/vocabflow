import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlayCircle, Search, Filter, MoreVertical, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import UploadMedia from "@/components/dashboard/UploadMedia";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch ALL media assets for the library
  const { data: mediaAssets } = await supabase
    .from("media_assets")
    .select("*, transcript_jobs(status, error_message)")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Library</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {mediaAssets?.length || 0} videos processed.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <UploadMedia userId={user.id} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Toolbar */}
        <div className="h-14 border-b border-slate-100 flex items-center justify-between px-4 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search videos..." 
                className="h-9 bg-white border border-slate-200 rounded-lg pl-9 pr-4 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all w-64"
              />
            </div>
            <button className="h-9 px-3 flex items-center gap-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
          
          <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-lg">
            <button className="w-7 h-7 flex items-center justify-center rounded bg-white shadow-sm text-slate-900">
              <List className="w-4 h-4" />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:text-slate-900 transition-colors">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!mediaAssets || mediaAssets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <PlayCircle className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Your library is empty</h3>
              <p className="text-sm text-slate-500 max-w-sm mb-6">Upload a video or paste a YouTube link to start extracting vocabulary and mastering new languages.</p>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-slate-100">
              {mediaAssets.map((asset) => {
                const jobStatus = asset.transcript_jobs?.[0]?.status;
                const displayStatus = asset.status === 'ready' ? 'Completed' 
                  : asset.status === 'failed' ? 'Failed'
                  : 'Processing';
                  
                const isProcessing = asset.status !== 'ready' && asset.status !== 'failed';

                return (
                  <li key={asset.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 relative">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-4 sm:px-6 py-4">
                      
                      {/* Main Group (Thumb + Info) */}
                      <div className="flex items-start gap-4 flex-1 min-w-0 w-full">
                        {/* Thumbnail */}
                        <div className="h-[60px] w-[106px] sm:h-[68px] sm:w-[120px] bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200/60 relative">
                          {asset.type === 'youtube' ? (
                            (() => {
                              const ytMatch = asset.source_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
                              const ytId = ytMatch ? ytMatch[1] : null;
                              return ytId ? (
                                <img 
                                  src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} 
                                  alt="Thumbnail" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-indigo-50 flex items-center justify-center">
                                  <span className="text-indigo-400 font-bold text-[10px] uppercase">YT</span>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                              <PlayCircle className="w-6 h-6 text-slate-300" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 py-0.5">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 sm:truncate">{asset.title}</h3>
                            {asset.status === 'ready' && (
                              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 hidden sm:block"></span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium text-slate-500">
                            <span className="uppercase tracking-wider text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                              {asset.type === 'youtube' ? 'YouTube' : 'Video'}
                            </span>
                            <span className="whitespace-nowrap">{new Date(asset.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            
                            {isProcessing && (
                              <span className="text-indigo-600 flex items-center gap-1.5 font-bold whitespace-nowrap">
                                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing
                              </span>
                            )}
                            {asset.status === 'failed' && (
                              <span className="text-rose-600 font-bold">Failed</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center mt-2 sm:mt-0">
                        {asset.status === 'ready' && (
                          <Link href={`/video/${asset.id}`} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors whitespace-nowrap">
                            Study
                          </Link>
                        )}
                        <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
