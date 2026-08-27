"use client";

import { useState } from "react";
import { Trash2, ExternalLink } from "lucide-react";
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

export default function AdminMediaClient({ initialMedia, userMap }: { initialMedia: MediaAsset[], userMap: Record<string, string> }) {
  const [media, setMedia] = useState<MediaAsset[]>(initialMedia);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

  const filteredMedia = selectedUserId === "all" ? media : media.filter(m => m.user_id === selectedUserId);
  const uniqueUsers = Array.from(new Set(media.map(m => m.user_id)));

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to completely delete this media asset and all associated jobs/data?")) {
      return;
    }
    
    setIsDeleting(id);
    try {
      const res = await deleteMediaAssetAdmin(id);
      if (res.success) {
        setMedia(prev => prev.filter(m => m.id !== id));
      } else {
        alert("Failed to delete: " + res.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 relative">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 right-1/4 w-1/2 h-1/2 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* User Tabs */}
      <div className="flex gap-2 overflow-x-auto p-1 mb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button 
          onClick={() => setSelectedUserId("all")} 
          className={`px-5 py-2 text-sm font-bold whitespace-nowrap rounded-full transition-all duration-300 ${selectedUserId === "all" ? "bg-white text-indigo-600 shadow-md dark:bg-white/10 dark:text-white dark:shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-transparent dark:border-white/10" : "bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:bg-transparent dark:text-neutral-400 dark:hover:text-white border border-transparent dark:hover:border-white/10"}`}
        >
          Tất cả người dùng
        </button>
        {uniqueUsers.map(uid => (
          <button 
            key={uid}
            onClick={() => setSelectedUserId(uid)} 
            className={`px-5 py-2 text-sm font-bold whitespace-nowrap rounded-full transition-all duration-300 flex items-center gap-2 ${selectedUserId === uid ? "bg-white text-indigo-600 shadow-md dark:bg-white/10 dark:text-white dark:shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-transparent dark:border-white/10" : "bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:bg-transparent dark:text-neutral-400 dark:hover:text-white border border-transparent dark:hover:border-white/10"}`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedUserId === uid ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' : 'bg-slate-200 text-slate-600 dark:bg-white/5 dark:text-neutral-300'}`}>
              {(userMap[uid] || "U").charAt(0).toUpperCase()}
            </div>
            {userMap[uid] || uid.substring(0, 8)}
          </button>
        ))}
      </div>
      <div className="flex border-b border-slate-200 dark:border-neutral-800 overflow-x-auto mb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button 
          onClick={() => setSelectedUserId("all")} 
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${selectedUserId === "all" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200"}`}
        >
          Tất cả người dùng
        </button>
        {uniqueUsers.map(uid => (
          <button 
            key={uid}
            onClick={() => setSelectedUserId(uid)} 
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${selectedUserId === uid ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200"}`}
          >
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold">
              {(userMap[uid] || "U").charAt(0).toUpperCase()}
            </div>
            {userMap[uid] || uid.substring(0, 8)}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-neutral-900/40 dark:backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl flex-1 relative">
      <div className="overflow-x-auto h-full">
        <table className="w-full text-left text-sm text-slate-600 dark:text-neutral-300">
          <thead className="bg-slate-50/80 dark:bg-white/5 text-slate-500 dark:text-neutral-400 uppercase tracking-wider text-[11px] font-bold sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 border-b border-slate-200 dark:border-white/10">Asset ID</th>
                  <th className="px-6 py-4 border-b border-slate-200 dark:border-white/10 min-w-[200px]">Title / Source</th>
                  {selectedUserId === "all" && <th className="px-6 py-4 border-b border-slate-200 dark:border-white/10">User</th>}
                  <th className="px-6 py-4 border-b border-slate-200 dark:border-white/10">Status</th>
                  <th className="px-6 py-4 border-b border-slate-200 dark:border-white/10 text-right">Actions</th>
                </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {filteredMedia.map((asset) => {
              const jobStatus = asset.transcript_jobs?.[0]?.status || asset.status;
              
              return (
                <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400 dark:text-neutral-500 group-hover:text-slate-500 dark:group-hover:text-neutral-400 transition-colors">{asset.id.substring(0, 13)}...</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1" title={asset.title}>
                      {asset.title || "Untitled"}
                    </div>
                    <a href={asset.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 w-fit">
                      {asset.type} <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  {selectedUserId === "all" && (
                    <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-neutral-300">
                      {userMap[asset.user_id] || asset.user_id.substring(0, 13)}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    {jobStatus === "completed" || jobStatus === "ready" ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-500/20 dark:text-emerald-400 rounded-full font-bold text-[11px] uppercase tracking-wide flex items-center w-fit">Completed</span>
                    ) : jobStatus === "failed" ? (
                      <span className="px-3 py-1 bg-rose-50 text-rose-600 dark:bg-rose-500/10 border border-rose-500/20 dark:text-rose-400 rounded-full font-bold text-[11px] uppercase tracking-wide flex items-center w-fit">Failed</span>
                    ) : (
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 border border-indigo-500/20 dark:text-indigo-400 rounded-full font-bold text-[11px] uppercase tracking-wide flex items-center w-fit animate-pulse">Processing</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(asset.id)}
                      disabled={isDeleting === asset.id}
                      className="p-2 text-slate-400 hover:text-white hover:bg-rose-500 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 rounded-xl transition-all duration-200 inline-flex disabled:opacity-50 shadow-sm hover:shadow-rose-500/25 ml-auto"
                      title="Force Delete Asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
            {filteredMedia.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No media assets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}
