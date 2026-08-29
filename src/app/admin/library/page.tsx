"use client";

import { useState, useEffect } from "react";
import { createPlaylist, deletePlaylist, getPlaylists, createAdminMediaJob } from "@/app/actions/admin";
import { Trash2, Plus, Upload, Video, Layers, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, Button, Modal, Badge } from "@/components/admin/ui";

export default function AdminLibraryPage() {
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
  const [logs, setLogs] = useState<{msg: string, type: 'info'|'success'|'error'}[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [batchUploadConfirm, setBatchUploadConfirm] = useState(false);

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

  const executeDeletePlaylist = async () => {
    if (!deleteConfirmId) return;
    try {
      await deletePlaylist(deleteConfirmId);
      fetchPlaylists();
    } catch (e) {
      alert("Failed to delete playlist.");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleBatchUploadClick = () => {
    const list = urls.split('\n').map(u => u.trim()).filter(u => u.length > 10);
    if (list.length === 0) return;
    setBatchUploadConfirm(true);
  };

  const handleBatchUpload = async () => {
    setBatchUploadConfirm(false);
    const list = urls.split('\n').map(u => u.trim()).filter(u => u.length > 10);
    if (list.length === 0) return;

    setUploading(true);
    setTotalUploads(list.length);
    setProgress(0);
    setLogs([]);

    for (let i = 0; i < list.length; i++) {
      const url = list[i];
      setLogs(prev => [...prev, { msg: `[${i+1}/${list.length}] Đang xử lý: ${url}`, type: 'info' }]);
      
      try {
        await createAdminMediaJob({
          sourceUrl: url,
          targetLanguage,
          playlistId: selectedPlaylistId || undefined,
          module: targetModule
        });
        setProgress(i + 1);
        setLogs(prev => [...prev, { msg: `Thành công: ${url}`, type: 'success' }]);
      } catch (err: any) {
        console.error(err);
        setLogs(prev => [...prev, { msg: `Lỗi: ${url} - ${err.message}`, type: 'error' }]);
      }
    }
    
    setUploading(false);
    setUrls("");
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-500" />
            Quản lý Kho Video Chung
          </h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">Upload hàng loạt và quản lý danh sách phát hệ thống.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Upload Multiple Videos */}
        <Card className="lg:col-span-3">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-500" />
              <CardTitle>Thêm Video Hàng Loạt</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Danh sách link YouTube (mỗi link 1 dòng)</label>
              <textarea 
                className="w-full h-32 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                placeholder="https://www.youtube.com/watch?v=...\nhttps://www.youtube.com/watch?v=..."
                value={urls}
                onChange={e => setUrls(e.target.value)}
                disabled={uploading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Playlist (Tùy chọn)</label>
                <select 
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  value={selectedPlaylistId}
                  onChange={e => setSelectedPlaylistId(e.target.value)}
                  disabled={uploading}
                >
                  <option value="">-- Video lẻ --</option>
                  {playlists.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Ngôn ngữ đích</label>
                <select 
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
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
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Phòng đích</label>
                <select 
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  value={targetModule}
                  onChange={e => setTargetModule(e.target.value)}
                  disabled={uploading}
                >
                  <option value="vocabulary">Phòng Từ Vựng</option>
                  <option value="shadowing">Phòng Shadowing</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleBatchUploadClick}
              disabled={uploading || urls.trim().length === 0}
              className="w-full h-12 text-sm mt-2"
              isLoading={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? `Đang xử lý ${progress}/${totalUploads}...` : "Upload Hàng Loạt"}
            </Button>

            {logs.length > 0 && (
              <div className="mt-4 bg-slate-900 dark:bg-black rounded-lg p-4 text-xs font-mono h-48 overflow-y-auto space-y-2 border border-slate-800 shadow-inner">
                {logs.map((l, i) => (
                  <div key={i} className={`flex items-start gap-2 ${l.type === 'success' ? 'text-emerald-400' : l.type === 'error' ? 'text-rose-400' : 'text-slate-300'}`}>
                    {l.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                    {l.type === 'error' && <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                    {l.type === 'info' && <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center mt-0.5">ℹ️</span>}
                    <span className="leading-tight">{l.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manage Playlists */}
        <Card className="lg:col-span-2 flex flex-col h-full">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-500" />
              <CardTitle>Quản Lý Playlist</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col flex-1 gap-4 overflow-hidden">
            <form onSubmit={handleCreatePlaylist} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Tên Playlist mới..." 
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button type="submit" size="sm" className="h-10 px-4 shrink-0">
                <Plus className="w-4 h-4 mr-1" /> Thêm
              </Button>
            </form>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 -mx-2 px-2">
              {loadingPlaylists ? (
                <div className="text-center text-sm text-slate-500 py-8">Đang tải...</div>
              ) : playlists.length === 0 ? (
                <div className="text-center text-sm text-slate-500 py-8">Chưa có playlist nào</div>
              ) : (
                playlists.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all group">
                    <div className="flex-1 truncate mr-3">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{p.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(p.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setDeleteConfirmId(p.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Delete Playlist Modal */}
      <Modal 
        isOpen={!!deleteConfirmId} 
        onClose={() => setDeleteConfirmId(null)} 
        title="Xóa Playlist này?"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 dark:bg-rose-500/10 rounded-lg border border-rose-100 dark:border-rose-500/20 text-rose-800 dark:text-rose-300 text-sm">
            <strong className="block mb-1 font-bold">CẢNH BÁO</strong>
            Bạn có chắc chắn muốn xóa playlist này? TOÀN BỘ các video bên trong cũng sẽ bị xóa sạch! Hành động này không thể hoàn tác.
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Hủy bỏ</Button>
            <Button variant="destructive" onClick={executeDeletePlaylist}>Xóa vĩnh viễn</Button>
          </div>
        </div>
      </Modal>

      {/* Batch Upload Modal */}
      <Modal 
        isOpen={batchUploadConfirm} 
        onClose={() => setBatchUploadConfirm(false)} 
        title="Xác nhận tải lên"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            Bạn sắp tải lên <Badge variant="info">{urls.split('\n').map(u => u.trim()).filter(u => u.length > 10).length}</Badge> video vào <strong>Phòng {targetModule === 'vocabulary' ? 'Từ vựng' : 'Shadowing'}</strong>. Quá trình xử lý sẽ diễn ra ở background.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setBatchUploadConfirm(false)}>Hủy bỏ</Button>
            <Button variant="default" onClick={handleBatchUpload}>
              <Upload className="w-4 h-4 mr-2" /> Tiến hành Upload
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
