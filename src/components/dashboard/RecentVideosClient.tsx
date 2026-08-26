"use client";

import { useEffect, useState } from "react";
import { PlayCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RecentVideosClient({ initialAssets }: { initialAssets: any[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const supabase = createClient();

  useEffect(() => {
    // Poll every 3 seconds to get the latest status
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("media_assets")
        .select("*, transcript_jobs(status, error_message)")
        .order("created_at", { ascending: false })
        .limit(5);

      if (data) {
        setAssets(data);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [supabase]);

  if (!assets || assets.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <PlayCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-sm font-semibold text-gray-900">Chưa có video nào</h3>
        <p className="mt-1 text-sm text-gray-500">Hãy tải lên một video hoặc dán link YouTube để bắt đầu trích xuất từ vựng.</p>
      </div>
    );
  }

  return (
    <ul role="list" className="divide-y divide-slate-100">
      {assets.map((asset) => {
        const jobStatus = asset.transcript_jobs?.[0]?.status;
        const displayStatus = asset.status === 'ready' ? 'Completed' 
          : asset.status === 'failed' ? 'Failed'
          : jobStatus === 'queued' ? 'Queued'
          : jobStatus === 'extracting_audio' ? 'Extracting Audio'
          : jobStatus === 'transcribing' ? 'Transcribing (AI)'
          : jobStatus === 'analyzing' ? 'Analyzing Vocabulary'
          : 'Processing';

        const isProcessing = asset.status !== 'ready' && asset.status !== 'failed';

        // Mock progression for UI purposes since we don't track exact % in DB yet
        let progress = 0;
        if (jobStatus === 'queued') progress = 10;
        if (jobStatus === 'extracting_audio') progress = 30;
        if (jobStatus === 'transcribing') progress = 60;
        if (jobStatus === 'analyzing') progress = 90;
        if (asset.status === 'ready') progress = 100;

        return (
          <li key={asset.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 p-4 sm:p-5">
              
              {/* Main Content (Thumb + Info) */}
              <div className="flex items-start gap-3 sm:gap-5 flex-1 min-w-0 w-full">
                
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
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 sm:truncate mb-2">{asset.title}</h3>
                  
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      asset.status === 'ready' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      asset.status === 'failed' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                      'bg-indigo-50 text-indigo-600 border-indigo-100'
                    }`}>
                      {isProcessing && (
                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {displayStatus}
                    </span>
                    
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 sm:py-1 rounded text-center">
                      {asset.type === 'youtube' ? 'YouTube' : 'Video'}
                    </span>

                    <span className="text-[10px] sm:text-xs font-medium text-slate-400 whitespace-nowrap">
                      {new Date(asset.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  
                  {isProcessing && (
                    <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                  
                  {asset.status === 'failed' && asset.transcript_jobs?.[0]?.error_message && (
                    <p className="mt-2 text-xs font-medium text-rose-500 truncate bg-rose-50 px-2 py-1 rounded border border-rose-100">
                      {asset.transcript_jobs[0].error_message}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center mt-2 sm:mt-0">
                {asset.status === 'ready' && (
                  <a href={`/video/${asset.id}`} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] sm:text-xs font-bold rounded-lg shadow-sm transition-colors whitespace-nowrap">
                    Continue
                  </a>
                )}
                <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                </button>
              </div>

            </div>
          </li>
        );
      })}
    </ul>
  );
}
