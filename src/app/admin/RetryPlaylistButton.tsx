"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, PlaySquare } from "lucide-react";

export default function RetryPlaylistButton({ playlistName, jobIds }: { playlistName: string, jobIds: string[] }) {
  const [retrying, setRetrying] = useState(false);
  const router = useRouter();

  const handleRetryAll = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (retrying || jobIds.length === 0) return;
    setRetrying(true);

    try {
      // Fire requests sequentially to avoid overwhelming the server
      for (const jobId of jobIds) {
        await fetch("/api/webhooks/transcription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId })
        });
        // Small delay between requests
        await new Promise(r => setTimeout(r, 500));
      }
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setRetrying(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
          <PlaySquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{playlistName}</h4>
          <p className="text-xs text-slate-500 dark:text-neutral-400">{jobIds.length} video đang kẹt/lỗi</p>
        </div>
      </div>
      
      <button 
        onClick={handleRetryAll}
        disabled={retrying || jobIds.length === 0}
        className={`px-4 py-2 flex items-center gap-2 text-xs font-bold rounded-lg transition-colors shadow-sm ${retrying ? 'bg-indigo-100 text-indigo-400 dark:bg-indigo-900/30' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
        {retrying ? 'Đang gửi...' : 'Khôi phục tất cả'}
      </button>
    </div>
  );
}
