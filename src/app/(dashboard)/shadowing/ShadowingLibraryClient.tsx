"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Headphones, Play, Calendar, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Asset = any;

export default function ShadowingLibraryClient({ initialAssets }: { initialAssets: Asset[] }) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, assetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm("Bạn có chắc chắn muốn xóa video này khỏi kho Shadowing không?")) {
      doDelete(assetId);
    }
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

  if (!assets || assets.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-neutral-800 p-12 text-center mt-8">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Headphones className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Chưa có video nào</h2>
        <p className="text-slate-500 dark:text-neutral-400">Hãy dán link YouTube lên khung phía trên để bắt đầu thêm video vào phòng luyện Shadowing nhé.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {assets.map((asset) => {
        const isProcessing = asset.status !== 'ready' && asset.status !== 'failed';
        const isDeleting = deleting === asset.id;
        return (
          <div key={asset.id} className="relative group">
            <Link
              href={isProcessing ? "#" : `/shadowing/${asset.id}`}
              className={`bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-300 flex flex-col ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
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

                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-white text-xs font-bold">Đang xử lý...</span>
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

            {/* Delete button */}
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
          </div>
        );
      })}
    </div>
  );
}
