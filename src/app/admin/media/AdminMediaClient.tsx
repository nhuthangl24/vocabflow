"use client";

import { useState } from "react";
import { Search, Clapperboard, ExternalLink, Play, Trash2, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { deleteMediaAssetAdmin } from "./actions";

export default function AdminMediaClient({ initialMedia, userMap }: { initialMedia: any[], userMap: Record<string, string> }) {
  const [search, setSearch] = useState("");
  const [media, setMedia] = useState(initialMedia);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (assetId: string) => {
    setIsDeleting(true);
    try {
      const res = await deleteMediaAssetAdmin(assetId);
      if (res.success) {
        setMedia(media.filter(m => m.id !== assetId));
      } else {
        alert("Lỗi khi xóa: " + res.error);
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const filteredMedia = media.filter(m => 
    !search || 
    m.title?.toLowerCase().includes(search.toLowerCase()) || 
    m.id.includes(search) || 
    m.source_url?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-300 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-pink-500" />
            Media Assets
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Quản lý video, bài báo và trạng thái trích xuất nội dung.</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Tìm theo Tiêu đề hoặc URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#111] border border-neutral-800 text-sm rounded-md pl-9 pr-4 py-1.5 focus:outline-none focus:border-neutral-600 text-white w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#111] border border-neutral-800 rounded-lg flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-[13px] font-mono whitespace-nowrap">
            <thead className="bg-[#151515] text-neutral-400 border-b border-neutral-800 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-2 font-medium">Media ID</th>
                <th className="px-4 py-2 font-medium">Tiêu đề</th>
                <th className="px-4 py-2 font-medium">Người dùng</th>
                <th className="px-4 py-2 font-medium">Loại</th>
                <th className="px-4 py-2 font-medium">Job gần nhất</th>
                <th className="px-4 py-2 font-medium">Ngày tạo</th>
                <th className="px-4 py-2 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {filteredMedia.map((m) => {
                const latestJob = m.transcript_jobs?.[0];
                return (
                  <tr key={m.id} className="hover:bg-[#1a1a1a] transition-colors group">
                    <td className="px-4 py-2.5 text-neutral-500">{m.id.substring(0, 8)}</td>
                    <td className="px-4 py-2.5 text-white font-sans text-sm max-w-[200px] truncate" title={m.title}>
                      {m.title || "Chưa có tiêu đề"}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-400 font-sans text-sm truncate max-w-[150px]">
                      {userMap[m.user_id] || m.user_id.substring(0, 8)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-neutral-800 text-neutral-400 border border-neutral-700">
                        {m.source_type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {latestJob ? (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                          latestJob.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                          latestJob.status === 'failed' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                          'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}>
                          {latestJob.status}
                        </span>
                      ) : (
                        <span className="text-neutral-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.source_url && (
                        <a href={m.source_url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-neutral-800 text-neutral-300 hover:text-white rounded hover:bg-neutral-700 inline-block transition-colors" title="Mở link gốc">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <Link href={`/shadowing/${m.id}`} className="p-1.5 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded inline-block transition-colors" title="Phát Video">
                        <Play className="w-3.5 h-3.5" />
                      </Link>
                      <button 
                        onClick={() => setDeleteConfirmId(m.id)}
                        className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded inline-block transition-colors" 
                        title="Xoá video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredMedia.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-600 font-sans">Không tìm thấy Media.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-[#151515] border-t border-neutral-800 px-4 py-2 text-xs text-neutral-500 flex justify-between items-center">
          <span>Tổng cộng {filteredMedia.length} Media</span>
        </div>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-[#111] border border-neutral-800 rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 text-red-500 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Xác nhận xoá</h3>
            </div>
            <p className="text-sm text-neutral-400 mb-6 font-sans">
              Hành động này sẽ xoá hoàn toàn Media này cùng tất cả transcript, từ vựng và phân tích ngữ pháp liên quan khỏi hệ thống. Thao tác này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3 font-sans">
              <button 
                disabled={isDeleting}
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-md text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button 
                disabled={isDeleting}
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-md text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Xoá vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
