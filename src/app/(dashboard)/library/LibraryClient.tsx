"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, PlayCircle, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";

type Asset = any; // We can use 'any' for now since the schema is complex, or define it properly

export default function LibraryClient({ initialAssets }: { initialAssets: Asset[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [targetLanguage, setTargetLanguage] = useState("All");
  const itemsPerPage = 8;

  // Filter assets
  const filteredAssets = initialAssets.filter(asset => {
    const matchesSearch = asset.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const assetLang = asset.transcript_jobs?.[0]?.settings?.targetLanguage || "English";
    const matchesLang = targetLanguage === "All" || assetLang === targetLanguage;
    return matchesSearch && matchesLang;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage);

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
      {/* Toolbar */}
      <div className="h-14 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between px-4 shrink-0 bg-slate-50/50 dark:bg-[#0a0a0a]/50">
        <div className="flex items-center gap-2 w-full max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 dark:text-neutral-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm video..." 
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full h-9 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-4 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>
          <select
            value={targetLanguage}
            onChange={(e) => {
              setTargetLanguage(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm font-medium text-slate-700 dark:text-neutral-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm shrink-0 dark:text-neutral-200"
          >
            <option value="All">Tất cả tiếng</option>
            <option value="English">Tiếng Anh</option>
            <option value="Chinese">Tiếng Trung</option>
            <option value="Japanese">Tiếng Nhật</option>
            <option value="Korean">Tiếng Hàn</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {!initialAssets || initialAssets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 flex-1">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-700">
              <PlayCircle className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1 dark:text-white">Thư viện trống</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6 dark:text-neutral-400">Tải lên video hoặc dán link YouTube để bắt đầu trích xuất từ vựng và học ngoại ngữ.</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 flex-1">
            <h3 className="text-base font-bold text-slate-900 mb-1 dark:text-white">Không tìm thấy video</h3>
            <p className="text-sm text-slate-500 dark:text-neutral-400">Thử thay đổi từ khóa tìm kiếm của bạn.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 sm:p-6">
              {currentAssets.map((asset) => {
                const jobStatus = asset.transcript_jobs?.[0]?.status;
                const isProcessing = asset.status !== 'ready' && asset.status !== 'failed';

                return (
                  <div key={asset.id} className="group bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-700 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col">
                    {/* Thumbnail */}
                    <div className="aspect-video bg-slate-100 dark:bg-[#0a0a0a] relative overflow-hidden border-b border-slate-100 dark:border-neutral-800 dark:bg-neutral-900">
                      {asset.type === 'youtube' ? (
                        (() => {
                          const ytMatch = asset.source_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
                          const ytId = ytMatch ? ytMatch[1] : null;
                          return ytId ? (
                            <img 
                              src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} 
                              alt="Thumbnail" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-indigo-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                              <span className="text-indigo-400 font-bold text-[10px] uppercase">YT</span>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 dark:bg-[#0a0a0a]">
                          <PlayCircle className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                      
                      {/* Status Badge Over Thumbnail */}
                      <div className="absolute top-2 right-2">
                        {asset.status === 'ready' && (
                          <span className="bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Hoàn tất</span>
                        )}
                        {asset.status === 'failed' && (
                          <span className="bg-rose-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Lỗi</span>
                        )}
                        {isProcessing && (
                          <span className="bg-indigo-600/90 dark:bg-white/90 text-white dark:text-[#0a0a0a] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-sm">
                            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang xử lý
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mb-2 flex-1" title={asset.title}>{asset.title}</h3>
                      
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-neutral-700 dark:border-neutral-800">
                        <div className="flex flex-col gap-1">
                          <span className="uppercase tracking-wider text-[10px] text-slate-400 font-bold dark:text-neutral-400">
                            {asset.type === 'youtube' ? 'YouTube' : 'Video'}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">{new Date(asset.created_at).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {asset.status === 'ready' && (
                            <Link href={`/video/${asset.id}`} className="w-8 h-8 flex items-center justify-center bg-indigo-50 dark:bg-neutral-800 text-indigo-600 dark:text-neutral-200 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors" title="Học tiếp">
                              <PlayCircle className="w-4 h-4" />
                            </Link>
                          )}
                          <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors dark:text-white dark:text-neutral-400">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-neutral-800 px-4 sm:px-6 py-4 mt-auto bg-slate-50/50 dark:bg-[#0a0a0a]/50 dark:border-neutral-700">
                <div className="text-sm text-slate-500 font-medium dark:text-neutral-400">
                  Hiển thị <span className="font-bold text-slate-900 dark:text-slate-100">{startIndex + 1}</span> đến <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min(startIndex + itemsPerPage, filteredAssets.length)}</span> trong số <span className="font-bold text-slate-900 dark:text-slate-100">{filteredAssets.length}</span> video
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-9 h-9 flex items-center justify-center bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const page = idx + 1;
                      // Logic to show limited pages if total pages > 5 could go here, keeping simple for now
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-colors shadow-sm ${ currentPage === page ? 'bg-indigo-600 text-white border-transparent' : 'bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-slate-700' }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm dark:bg-[#0a0a0a] dark:text-neutral-300 dark:border-neutral-700"
                  >
                    <ChevronRight className="w-4 h-4" />
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
