"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Headphones, Play, Calendar, Trash2, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Asset = any;
type Playlist = any;

export default function ShadowingLibraryClient({ 
  initialAssets,
  publicAssets = [],
  playlists = [],
  hideTabs = false
}: { 
  initialAssets: Asset[],
  publicAssets?: Asset[],
  playlists?: Playlist[],
  hideTabs?: boolean
}) {
  const [activeTab, setActiveTab] = useState<"public" | "private">("public");
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setAssets(initialAssets);
  }, [initialAssets]);
  const [navigating, setNavigating] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, assetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmId(assetId);
  };

  useEffect(() => {
    const processingAssets = assets.filter(a => a.status !== 'ready' && a.status !== 'failed');
    if (processingAssets.length === 0) return;

    const interval = setInterval(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("media_assets")
        .select("*")
        .in("id", processingAssets.map(a => a.id));
      
      if (data && data.length > 0) {
        setAssets(prev => prev.map(p => {
          const updated = data.find(d => d.id === p.id);
          return updated ? updated : p;
        }));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [assets]);

  const doDelete = async (assetId: string) => {
    setConfirmId(null);
    setDeleting(assetId);
    try {
      const supabase = createClient();
      await supabase
        .from("media_assets")
        .update({ status: "deleted" })
        .eq("id", assetId);
      
      setAssets(prev => prev.filter(a => a.id !== assetId));
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(null);
    }
  };

  const baseAssets = hideTabs ? assets : (activeTab === "private" ? assets : publicAssets.filter(a => !a.playlist_id));
  const basePlaylists = hideTabs ? [] : (activeTab === "public" ? playlists : []);
  
  const allItems = [...basePlaylists.map(p => ({...p, isPlaylist: true})), ...baseAssets];
  const totalItems = allItems.length;

  if (totalItems === 0) {
    return (
      <div className="flex flex-col gap-4">
        {/* Tabs Row */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setActiveTab("public")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "public" ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"}`}
          >
            Kho Video
          </button>
          <button
            onClick={() => setActiveTab("private")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "private" ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"}`}
          >
            Video Của Bạn
          </button>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-neutral-800 p-12 text-center mt-2">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Headphones className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Chưa có video nào</h2>
          <p className="text-slate-500 dark:text-neutral-400">
            {activeTab === "public" 
              ? "Hiện chưa có video nào được quản trị viên đăng tải trong Kho Video chung."
              : "Hãy dán link YouTube lên khung phía trên để bắt đầu thêm video vào phòng luyện Shadowing nhé."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs Row */}
      {!hideTabs && (
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setActiveTab("public")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "public" ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"}`}
          >
            Kho Video
          </button>
          <button
            onClick={() => setActiveTab("private")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "private" ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"}`}
          >
            Video Của Bạn
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {allItems.map((item) => {
          if (item.isPlaylist) {
            const count = publicAssets.filter(a => a.playlist_id === item.id).length;
            return (
              <Link href={`/shadowing/playlist/${item.id}`} key={`pl-${item.id}`} className="h-full group bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-300 flex flex-col">
                <div className="aspect-video relative bg-slate-900 overflow-hidden">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt="Playlist" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 opacity-90 group-hover:scale-105 transition-transform duration-500" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <Layers className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    {count} VIDEO
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h3>
                  <div className="mt-auto flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
                    <span className="font-medium">Playlist</span>
                  </div>
                </div>
              </Link>
            );
          }

          const asset = item;
          const isProcessing = asset.status !== 'ready' && asset.status !== 'failed';
          const isDeleting = deleting === asset.id;
          const isNavigating = navigating === asset.id;
        return (
          <div key={asset.id} className="relative group h-full flex flex-col">
            <Link
              href={isProcessing ? "#" : `/shadowing/${asset.id}`}
              onClick={(e) => {
                if (isProcessing || isDeleting) {
                  e.preventDefault();
                  return;
                }
                setNavigating(asset.id);
              }}
              className={`flex-1 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-300 flex flex-col ${(isDeleting || isNavigating) ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="aspect-video relative bg-slate-900 overflow-hidden">
                {(asset.type === 'youtube' && asset.source_url) ? (
                  <img
                    src={`https://img.youtube.com/vi/${asset.source_url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1]}/hqdefault.jpg`}
                    alt={asset.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <Play className="w-12 h-12 text-white/30" />
                  </div>
                )}

                {(isProcessing || isNavigating) && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-white text-xs font-bold">{isNavigating ? 'Đang tải...' : 'Đang xử lý...'}</span>
                  </div>
                )}

                {asset.status === 'failed' && (
                  <div className="absolute inset-0 bg-rose-900/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <span className="text-white text-xs font-bold">Lỗi xử lý</span>
                  </div>
                )}

                {/* Hover Play overlay */}
                {!isProcessing && asset.status !== 'failed' && (
                  <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                    <div className="w-14 h-14 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300 delay-100">
                      <Headphones className="w-6 h-6" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {asset.title}
                </h3>
                <div className="mt-auto flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(asset.created_at).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            </Link>

              {/* Delete button (only for private assets) */}
              {activeTab === "private" && (
                <button
                  onClick={(e) => handleDeleteClick(e, asset.id)}
                  disabled={isDeleting}
                  className={`absolute top-2 right-2 z-10 p-2 text-white rounded-full transition-all duration-200 backdrop-blur-sm ${
                    confirmId === asset.id 
                      ? 'opacity-100 bg-rose-600 scale-110 animate-pulse' 
                      : 'opacity-0 group-hover:opacity-100 bg-black/60 hover:bg-rose-600'
                  }`}
                  title={confirmId === asset.id ? "Bấm lần nữa để xóa" : "Xóa video"}
                >
                  {isDeleting ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4" onClick={() => setConfirmId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-[#0a0a0a]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 dark:text-white">Xóa video này?</h3>
              <p className="text-sm text-slate-500 mb-6 dark:text-neutral-400">
                Bạn có chắc chắn muốn xóa video này khỏi kho Shadowing không? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmId(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors dark:text-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={() => doDelete(confirmId)}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors"
                >
                  Xóa ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
