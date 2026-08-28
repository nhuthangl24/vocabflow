"use client";

import { useEffect, useState } from "react";
import { PlayCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function RecentVideosClient({ initialAssets, userId }: { initialAssets: any[], userId?: string }) {
  const [assets, setAssets] = useState(initialAssets);
  const supabase = createClient();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    // Poll every 3 seconds to get the latest status (vocabulary only)
    const interval = setInterval(async () => {
      let query = supabase
        .from("media_assets")
        .select("*, transcript_jobs(status, error_message)")
        .neq("status", "deleted")
        .eq("module", "vocabulary")
        .order("created_at", { ascending: false })
        .limit(4);

      if (userId) {
        query = query
          .eq("user_id", userId)
          .or("is_public.is.null,is_public.eq.false");
      }

      const { data } = await query;

      if (data) {
        setAssets(data);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [supabase]);

  // Handle clicking outside to close menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openMenuId) setOpenMenuId(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
    setOpenMenuId(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    
    // Mark as deleted instead of actual DB deletion to preserve AI limit count
    await supabase.from("media_assets").update({ status: 'deleted' }).eq("id", deleteConfirmId);
    
    // Optimistic UI update
    setAssets(prev => prev.filter(a => a.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  };

  if (!assets || assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-[#0a0a0a]/50 dark:bg-[#0a0a0a]">
        <div className="w-12 h-12 bg-slate-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mb-3 border border-slate-200 dark:border-neutral-700">
          <PlayCircle className="w-6 h-6 text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-neutral-400 mb-1">Chưa có video nào</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-neutral-400">Tải lên video đầu tiên để bắt đầu học.</p>
      </div>
    );
  }

  return (
    <>
      <ul role="list" className="divide-y divide-slate-100 dark:divide-slate-800 pb-0">
        {assets.map((asset) => {
          const jobStatus = asset.transcript_jobs?.[0]?.status;
          const displayStatus = asset.status === 'ready' ? 'Hoàn tất' 
            : asset.status === 'failed' ? 'Lỗi'
            : jobStatus === 'queued' ? 'Đang chờ xếp hàng'
            : jobStatus === 'extracting_audio' ? 'Đang tách âm thanh'
            : jobStatus === 'transcribing' ? 'AI đang nghe (Dịch)'
            : jobStatus === 'analyzing' ? 'Đang phân tích từ vựng'
            : 'Đang xử lý';

          const isProcessing = asset.status !== 'ready' && asset.status !== 'failed';

          // Mock progression for UI purposes since we don't track exact % in DB yet
          let progress = 0;
          if (jobStatus === 'queued') progress = 10;
          if (jobStatus === 'extracting_audio') progress = 30;
          if (jobStatus === 'transcribing') progress = 60;
          if (jobStatus === 'analyzing') progress = 90;
          if (asset.status === 'ready') progress = 100;

          return (
            <li key={asset.id} className="group hover:bg-slate-50/50 dark:hover:bg-neutral-800/30 transition-colors border-b border-slate-100 dark:border-neutral-800 last:border-0 relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 p-4 sm:p-5">
                
                {/* Main Content (Thumb + Info) */}
                <Link href={`/video/${asset.id}`} className="flex items-start gap-3 sm:gap-5 flex-1 min-w-0 w-full group-hover:opacity-90 transition-opacity">
                  
                  {/* Thumbnail */}
                  <div className="h-[60px] w-[106px] sm:h-[68px] sm:w-[120px] bg-slate-100 dark:bg-neutral-900 rounded-lg overflow-hidden shrink-0 border border-slate-200/60 dark:border-neutral-700 relative">
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
                          <div className="w-full h-full bg-indigo-50 dark:bg-neutral-800 flex items-center justify-center">
                            <span className="text-indigo-400 font-bold text-[10px] uppercase">YT</span>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="w-full h-full bg-slate-50 dark:bg-[#0a0a0a]/50 flex items-center justify-center dark:bg-[#0a0a0a]">
                        <PlayCircle className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2 sm:truncate mb-2 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">{asset.title}</h3>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${ asset.status === 'ready' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800/50' : asset.status === 'failed' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:border-rose-800/50' : 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300' }`}>
                        {isProcessing && (
                          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {displayStatus}
                      </span>
                      
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-900 px-2 py-0.5 sm:py-1 rounded text-center">
                        {asset.type === 'youtube' ? 'YouTube' : 'Video'}
                      </span>

                      <span className="text-[10px] sm:text-xs font-medium text-slate-400 whitespace-nowrap dark:text-neutral-400">
                        {new Date(asset.created_at).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    
                    {isProcessing && (
                      <div className="mt-3 w-full bg-slate-100 dark:bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-500 dark:bg-white h-1.5 rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                    
                    {asset.status === 'failed' && asset.transcript_jobs?.[0]?.error_message && (
                      <p className="mt-2 text-xs font-medium text-rose-500 truncate bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded border border-rose-100 dark:border-rose-800/50">
                        {asset.transcript_jobs[0].error_message}
                      </p>
                    )}
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center mt-2 sm:mt-0 relative">
                  {asset.status === 'ready' && (
                    <a href={`/video/${asset.id}`} className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] sm:text-xs font-bold rounded-lg shadow-sm transition-colors whitespace-nowrap">
                      Tiếp tục học
                    </a>
                  )}
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === asset.id ? null : asset.id);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {openMenuId === asset.id && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-10 animate-in fade-in zoom-in-95 duration-100 dark:bg-[#0a0a0a] dark:border-neutral-800">
                        <button
                          onClick={(e) => confirmDelete(asset.id, e)}
                          className="w-full text-left px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors flex items-center dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Xóa video
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </li>
          );
        })}
      </ul>

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-[#0a0a0a]">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 dark:text-white">Xóa video này?</h3>
              <p className="text-sm text-slate-500 mb-6 dark:text-neutral-400">
                Bạn có chắc chắn muốn xóa video này không? Mọi dữ liệu từ vựng và ngữ pháp sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors dark:text-neutral-200 dark:bg-neutral-900"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors"
                >
                  Xóa ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
