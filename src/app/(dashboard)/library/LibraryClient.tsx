"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Filter, PlayCircle, MoreVertical, ChevronLeft, ChevronRight, Layers, Video } from "lucide-react";

type Asset = any;
type Playlist = any;

export default function LibraryClient({ 
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
  const [activeTab, setActiveTab] = useState<"public" | "private">("private");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const router = useRouter();

  // Filter assets based on active tab or if tabs are hidden (treat as private for standard filtering)
  const baseAssets = (activeTab === "private" || hideTabs) ? initialAssets : publicAssets.filter((a: any) => !a.playlist_id);
  
  const filteredAssets = baseAssets.filter((asset: any) => {
    return asset.title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredPlaylists = activeTab === "public" ? playlists.filter((p: any) => p.title.toLowerCase().includes(searchQuery.toLowerCase())) : [];
  
  const totalItems = filteredPlaylists.length + filteredAssets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Combine for pagination
  const allFilteredItems = [...filteredPlaylists.map(p => ({...p, isPlaylist: true})), ...filteredAssets];
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = allFilteredItems.slice(startIndex, startIndex + itemsPerPage);



  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Reset page to 1 when searching
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="bg-slate-100/50 dark:bg-[#0a0a0a]/50 rounded-xl border border-slate-200/60 dark:border-neutral-800 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Tabs Row */}
      {!hideTabs && (
        <div className="flex px-4 pt-4 shrink-0 bg-slate-50/50 dark:bg-[#0a0a0a]/50">
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab("public"); setCurrentPage(1); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "public" ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"}`}
            >
              Kho Video
            </button>
            <button
              onClick={() => { setActiveTab("private"); setCurrentPage(1); }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "private" ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"}`}
            >
              Video Của Bạn
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="h-12 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between px-4 shrink-0 bg-slate-50/50 dark:bg-[#0a0a0a]/50">
        <div className="flex items-center gap-2 w-full max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 dark:text-neutral-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm video..." 
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full h-8 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-4 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col scrollbar-hide">
        {totalItems === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 flex-1">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-700">
              <PlayCircle className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1 dark:text-white">Thư viện trống</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6 dark:text-neutral-400">Không tìm thấy video hay playlist nào.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-3 lg:p-4">
              {currentItems.map((item) => {
                if (item.isPlaylist) {
                  const count = publicAssets.filter((a: any) => a.playlist_id === item.id).length;
                  return (
                    <Link href={`/library/playlist/${item.id}`} key={`pl-${item.id}`} className="group relative rounded-2xl bg-white dark:bg-[#0f0f11] border border-slate-200/80 dark:border-white/5 hover:border-indigo-500/30 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col">
                      <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-neutral-900">
                        {item.thumbnail_url ? (
                          <img src={item.thumbnail_url} alt="Playlist" className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-slate-800 to-black transition-transform duration-700 ease-out group-hover:scale-110" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
                        
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-lg">
                            <Layers className="w-6 h-6" />
                          </div>
                        </div>

                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 uppercase tracking-wider">
                          <Layers className="w-3 h-3 text-indigo-400" />
                          {count} VIDEO
                        </div>
                      </div>
                      <div className="p-3 flex-1 flex flex-col gap-1.5">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex-1">{item.title}</h3>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[10px] text-slate-500 dark:text-neutral-500 font-medium tracking-wide">PLAYLIST</p>
                        </div>
                      </div>
                    </Link>
                  )
                }

                const asset = item;
                const isProcessing = asset.status !== 'ready' && asset.status !== 'failed';

                return (
                  <div key={asset.id} className="group relative rounded-2xl bg-white dark:bg-[#0f0f11] border border-slate-200/80 dark:border-white/5 hover:border-indigo-500/30 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col block">
                    <Link href={asset.status === 'ready' ? `/video/${asset.id}` : '#'} className={`relative aspect-video overflow-hidden bg-slate-100 dark:bg-neutral-900 block ${asset.status !== 'ready' ? 'cursor-default' : 'cursor-pointer'}`}>
                      {asset.type === 'youtube' ? (
                        (() => {
                          const ytMatch = asset.source_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
                          const ytId = ytMatch ? ytMatch[1] : null;
                          return ytId ? (
                            <img 
                              src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} 
                              onError={(e) => {
                                // Fallback to mqdefault if maxresdefault doesn't exist
                                e.currentTarget.src = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
                              }}
                              alt="Thumbnail" 
                              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 transition-transform duration-700 ease-out group-hover:scale-110 flex items-center justify-center">
                              <span className="text-indigo-400 font-bold text-xs uppercase">YT</span>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-neutral-800 transition-transform duration-700 ease-out group-hover:scale-110 flex items-center justify-center">
                          <PlayCircle className="w-8 h-8 text-slate-300 dark:text-neutral-600" />
                        </div>
                      )}
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
                      
                      {/* Play Button Hover (only if ready) */}
                      {asset.status === 'ready' && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-lg">
                            <PlayCircle className="w-8 h-8 fill-white/10" />
                          </div>
                        </div>
                      )}

                      {/* Status Badges */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                        {asset.status === 'ready' && (
                          <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wider">Sẵn sàng</span>
                        )}
                        {asset.status === 'failed' && (
                          <span className="bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wider">Lỗi</span>
                        )}
                        {isProcessing && (
                          <span className="bg-indigo-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1.5 backdrop-blur-md uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                            Đang xử lý
                          </span>
                        )}
                      </div>

                      {/* Video Type Badge */}
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          {asset.type === 'youtube' ? <Video className="w-3 h-3 text-red-500" /> : <Video className="w-3 h-3 text-indigo-400" />}
                          {asset.type === 'youtube' ? 'YouTube' : 'Video'}
                        </span>
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="p-3 flex-1 flex flex-col gap-1.5">
                      <Link href={asset.status === 'ready' ? `/video/${asset.id}` : '#'} className={asset.status !== 'ready' ? 'pointer-events-none' : ''}>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={asset.title}>
                          {asset.title}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center justify-between mt-auto pt-1">
                        <span className="text-[10px] text-slate-500 dark:text-neutral-500 font-medium tracking-wide">
                          {new Date(asset.created_at).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          {asset.status !== 'ready' && (
                            <button className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors dark:text-neutral-500">
                              <MoreVertical className="w-3 h-3" />
                            </button>
                          )}
                          {asset.status === 'ready' && (
                            <button className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors dark:text-neutral-500">
                              <MoreVertical className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-auto px-4 py-2 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#0a0a0a]/50 shrink-0">
                <span className="text-xs text-slate-500 dark:text-neutral-400">
                  Hiển thị <span className="font-bold text-slate-900 dark:text-white">{startIndex + 1}</span> đến <span className="font-bold text-slate-900 dark:text-white">{Math.min(startIndex + itemsPerPage, totalItems)}</span> trong số <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> mục
                </span>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1 hidden sm:flex">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-colors ${
                            currentPage === pageNum 
                              ? "bg-indigo-600 text-white border border-indigo-600" 
                              : "border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
