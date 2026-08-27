"use client";

import { useState } from "react";
import { Trash2, ExternalLink, ArrowLeft, Play, Video } from "lucide-react";
import { deleteMediaAssetAdmin } from "./actions";

type MediaAsset = {
  id: string;
  title: string;
  source_url: string;
  type: string;
  status: string;
  created_at: string;
  user_id: string;
  transcript_jobs: any[];
};

const getYoutubeId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
};

export default function AdminMediaClient({ initialMedia, userMap }: { initialMedia: MediaAsset[], userMap: Record<string, string> }) {
  const [media, setMedia] = useState<MediaAsset[]>(initialMedia);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<"users" | "media">("users");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const uniqueUsers = Array.from(new Set(media.map(m => m.user_id)));

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to completely delete this media asset and all associated jobs/data?")) {
      return;
    }
    
    setIsDeleting(id);
    try {
      const res = await deleteMediaAssetAdmin(id);
      if (res.success) {
        setMedia(prev => prev.filter(m => m.id !== id));
      } else {
        alert("Delete failed: " + res.error);
      }
    } catch (err) {
      alert("Error deleting media");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUserClick = (uid: string) => {
    setSelectedUserId(uid);
    setViewMode("media");
  };

  const handleBack = () => {
    setViewMode("users");
    setSelectedUserId(null);
  };

  if (viewMode === "users") {
    return (
      <div className="flex flex-col h-full gap-6 relative">
        <div className="absolute top-1/4 right-1/4 w-1/2 h-1/2 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
          {uniqueUsers.map(uid => {
            const userMedia = media.filter(m => m.user_id === uid);
            const email = userMap[uid] || uid;
            return (
              <div 
                key={uid} 
                onClick={() => handleUserClick(uid)} 
                className="cursor-pointer bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-700/50 flex flex-col items-center text-center gap-4 group"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-3xl font-black shadow-inner group-hover:scale-110 transition-transform duration-300">
                  {email.charAt(0).toUpperCase()}
                </div>
                <div className="w-full">
                  <h3 className="font-bold text-slate-900 dark:text-white truncate w-full text-base mb-1" title={email}>{email}</h3>
                  <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-800/50 w-fit mx-auto px-3 py-1 rounded-full">
                    <Video className="w-3.5 h-3.5" />
                    <span>{userMedia.length} Videos</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {uniqueUsers.length === 0 && (
          <div className="text-center py-20 text-slate-500 font-medium">Chưa có người dùng nào tải video lên.</div>
        )}
      </div>
    );
  }

  // Media View
  const userMedia = media.filter(m => m.user_id === selectedUserId);
  const email = selectedUserId ? (userMap[selectedUserId] || selectedUserId) : "";

  return (
    <div className="flex flex-col h-full gap-4 relative">
      <button 
        onClick={handleBack} 
        className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 transition-colors w-fit px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-800/50"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách User
      </button>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
          {email.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Kho Video của <span className="text-indigo-600 dark:text-indigo-400">{email}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {userMedia.map((asset) => {
          const ytId = getYoutubeId(asset.source_url);
          const thumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
          const jobStatus = asset.transcript_jobs?.[0]?.status || asset.status;
          
          return (
            <div key={asset.id} className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group">
              <div className="aspect-video bg-slate-100 dark:bg-neutral-800 relative overflow-hidden">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Play className="w-12 h-12 opacity-50" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {jobStatus === "completed" || jobStatus === "ready" ? (
                    <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-md font-bold text-[10px] uppercase tracking-wider shadow-sm">Completed</span>
                  ) : jobStatus === "failed" ? (
                    <span className="px-2.5 py-1 bg-rose-500 text-white rounded-md font-bold text-[10px] uppercase tracking-wider shadow-sm">Failed</span>
                  ) : (
                    <span className="px-2.5 py-1 bg-indigo-500 text-white rounded-md font-bold text-[10px] uppercase tracking-wider shadow-sm animate-pulse">Processing</span>
                  )}
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                  <a 
                    href={asset.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                    title="View Source"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={(e) => handleDelete(asset.id, e)}
                    disabled={isDeleting === asset.id}
                    className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg disabled:opacity-50"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight mb-2" title={asset.title}>
                  {asset.title || "Untitled Video"}
                </h3>
                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-neutral-800 px-2 py-0.5 rounded">
                    {asset.id.substring(0, 8)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {userMedia.length === 0 && (
        <div className="text-center py-20 text-slate-500">Người dùng này chưa có video nào.</div>
      )}
    </div>
  );
}
