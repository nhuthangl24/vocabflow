"use client";

import { useState, useEffect } from "react";
import { createPlaylist, deletePlaylist, getPlaylists, createAdminMediaJob } from "@/app/actions/admin";
import { Trash2, Plus, Upload, Youtube, Layers } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  
  // Playlists
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  
  // Batch Upload
  const [urls, setUrls] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [targetModule, setTargetModule] = useState("vocabulary");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalUploads, setTotalUploads] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const data = await getPlaylists();
      setPlaylists(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    try {
      await createPlaylist(newTitle, newDesc);
      setNewTitle("");
      setNewDesc("");
      fetchPlaylists();
    } catch (e) {
      alert("Failed to create playlist. Are you an admin?");
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa playlist này? TOÀN BỘ các video bên trong playlist cũng sẽ bị xóa sạch!")) return;
    try {
      await deletePlaylist(id);
      fetchPlaylists();
    } catch (e) {
      alert("Failed to delete playlist.");
    }
  };

  const handleBatchUpload = async () => {
    const list = urls.split('\n').map(u => u.trim()).filter(u => u.length > 10);
    if (list.length === 0) return;
    
    if (!confirm(`Bạn sắp tải lên ${list.length} video vào phòng ${targetModule === 'vocabulary' ? 'Từ vựng' : 'Shadowing'}. Tiếp tục?`)) return;

    setUploading(true);
    setTotalUploads(list.length);
    setProgress(0);
    setLogs([]);

    for (let i = 0; i < list.length; i++) {
      const url = list[i];
      setLogs(prev => [...prev, `[${i+1}/${list.length}] Đang xử lý: ${url}`]);
      
      try {
        await createAdminMediaJob({
          sourceUrl: url,
          targetLanguage,
          playlistId: selectedPlaylistId || undefined,
          module: targetModule
        });
        setProgress(i + 1);
        setLogs(prev => [...prev, `✅ Thành công: ${url}`]);
      } catch (err: any) {
        console.error(err);
        setLogs(prev => [...prev, `❌ Lỗi: ${url} - ${err.message}`]);
      }
    }
    
    setUploading(false);
    setUrls("");
  };

  return (
    <div className="max-w-5xl mx-auto p-6 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Quản lý Kho Video Chung & Upload hàng loạt</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Upload Multiple Videos */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-bold">Thêm Video Hàng Loạt</h2>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Danh sách link YouTube (mỗi link 1 dòng)</label>
            <textarea 
              className="w-full h-32 rounded-lg border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 p-3 text-sm focus:ring-indigo-500 outline-none"
              placeholder="https://www.youtube.com/watch?v=...\nhttps://www.youtube.com/watch?v=..."
              value={urls}
              onChange={e => setUrls(e.target.value)}
              disabled={uploading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Playlist (Tùy chọn)</label>
              <select 
                className="w-full rounded-lg border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 p-3 text-sm outline-none"
                value={selectedPlaylistId}
                onChange={e => setSelectedPlaylistId(e.target.value)}
                disabled={uploading}
              >
                <option value="">-- Không chọn (Video lẻ) --</option>
                {playlists.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngôn ngữ đích</label>
              <select 
                className="w-full rounded-lg border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 p-3 text-sm outline-none"
                value={targetLanguage}
                onChange={e => setTargetLanguage(e.target.value)}
                disabled={uploading}
              >
                <option value="English">Tiếng Anh</option>
                <option value="Chinese">Tiếng Trung</option>
                <option value="Japanese">Tiếng Nhật</option>
                <option value="Korean">Tiếng Hàn</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phòng đích</label>
              <select 
                className="w-full rounded-lg border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 p-3 text-sm outline-none"
                value={targetModule}
                onChange={e => setTargetModule(e.target.value)}
                disabled={uploading}
              >
                <option value="vocabulary">Phòng Từ Vựng</option>
                <option value="shadowing">Phòng Shadowing</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleBatchUpload}
            disabled={uploading || urls.trim().length === 0}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {uploading ? `Đang xử lý ${progress}/${totalUploads}...` : "Upload Hàng Loạt"}
          </button>

          {logs.length > 0 && (
            <div className="mt-4 bg-slate-900 text-slate-300 rounded-lg p-3 text-xs font-mono h-32 overflow-y-auto">
              {logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
          )}
        </div>

        {/* Manage Playlists */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-bold">Quản Lý Playlist</h2>
          </div>

          <form onSubmit={handleCreatePlaylist} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Tên Playlist..." 
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="flex-1 h-10 px-3 rounded-lg border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm outline-none"
            />
            <button type="submit" className="h-10 px-4 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded-lg font-bold hover:opacity-80 transition-opacity flex items-center gap-1">
              <Plus className="w-4 h-4" /> Thêm
            </button>
          </form>

          <div className="flex-1 mt-2 flex flex-col gap-2 overflow-y-auto max-h-64 pr-2">
            {loadingPlaylists ? (
              <div className="text-center text-sm text-gray-500 py-4">Đang tải...</div>
            ) : playlists.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-4">Chưa có playlist nào</div>
            ) : (
              playlists.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950">
                  <div className="flex-1 truncate">
                    <p className="font-semibold text-sm truncate">{p.title}</p>
                    <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleDeletePlaylist(p.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-md transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
