"use client";

import { useState, useEffect, useTransition } from "react";
import {
  createPlaylist, deletePlaylist, getPlaylists, createAdminMediaJob,
} from "@/app/actions/admin";
import {
  Trash2, Plus, Upload, Video, Layers, CheckCircle2, XCircle,
  BookOpen, Zap, Globe, Eye, EyeOff, RefreshCw, Edit2, MoreHorizontal,
  Filter, Search, ChevronDown, Info, AlertCircle, Clock, CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

type MediaAsset = {
  id: string;
  title: string;
  type: string;
  source_url: string | null;
  status: string;
  publish_status: string;
  module: string;
  thumbnail_url: string | null;
  language: string | null;
  category: string | null;
  level: string | null;
  tags: string[];
  playlist_id: string | null;
  is_public: boolean;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
  retry_count: number;
};

type Playlist = { id: string; title: string; created_at: string };

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string; icon: React.FC<any> }> = {
    ready: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "Ready", icon: CheckCircle },
    processing: { color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", label: "Processing", icon: Clock },
    pending: { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "Pending", icon: Clock },
    failed: { color: "text-red-400 bg-red-500/10 border-red-500/20", label: "Failed", icon: XCircle },
    deleted: { color: "text-neutral-600 bg-neutral-800 border-neutral-700", label: "Deleted", icon: Trash2 },
  };
  const s = map[status] || map.pending;
  const Icon = s.icon;
  return (
    <span className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${s.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {s.label}
    </span>
  );
}

function PublishBadge({ status }: { status: string }) {
  return status === "published"
    ? <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/20"><Eye className="w-2.5 h-2.5" />Published</span>
    : <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border text-neutral-500 bg-neutral-900 border-neutral-800"><EyeOff className="w-2.5 h-2.5" />Draft</span>;
}

// ─── Video Row ───────────────────────────────────────────────────────────────

function VideoRow({ asset, playlists, onAction }: { asset: MediaAsset; playlists: Playlist[]; onAction: (id: string, action: string, value?: any) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const duration = asset.duration_seconds
    ? `${Math.floor(asset.duration_seconds / 60)}:${String(asset.duration_seconds % 60).padStart(2, "0")}`
    : null;

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-900/30 transition-colors border-b border-neutral-800/40 last:border-b-0 first:rounded-t-xl last:rounded-b-xl">
      {/* Thumbnail */}
      <div className="w-20 h-12 rounded-lg overflow-hidden bg-neutral-900 shrink-0 relative">
        {asset.thumbnail_url
          ? <img src={asset.thumbnail_url} alt={asset.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Video className="w-5 h-5 text-neutral-700" /></div>
        }
        {duration && (
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono px-1 rounded">
            {duration}
          </div>
        )}
        {asset.module === "shadowing"
          ? <div className="absolute top-1 left-1 bg-indigo-500/90 text-white text-[8px] font-bold px-1 rounded">SH</div>
          : <div className="absolute top-1 left-1 bg-emerald-500/90 text-white text-[8px] font-bold px-1 rounded">VC</div>
        }
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-200 truncate">{asset.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <StatusBadge status={asset.status} />
          <PublishBadge status={asset.publish_status} />
          {asset.language && <span className="text-[9px] text-neutral-600 border border-neutral-800 px-1.5 py-0.5 rounded">{asset.language}</span>}
          {asset.level && <span className="text-[9px] text-neutral-600 border border-neutral-800 px-1.5 py-0.5 rounded">{asset.level}</span>}
          {asset.retry_count > 0 && <span className="text-[9px] text-amber-500">↺ {asset.retry_count} retry</span>}
        </div>
        {asset.source_url && (
          <a href={asset.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-neutral-600 hover:text-indigo-400 truncate block mt-0.5 transition-colors max-w-xs">
            {asset.source_url.replace(/https?:\/\/(www\.)?/, "")}
          </a>
        )}
      </div>

      {/* Date */}
      <div className="text-[10px] text-neutral-600 shrink-0 hidden md:block">
        {new Date(asset.created_at).toLocaleDateString("vi-VN")}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0 relative">
        {/* Quick publish toggle */}
        <button
          onClick={() => onAction(asset.id, "toggle_publish", asset.publish_status)}
          className={`px-2 py-1 rounded-lg text-xs transition-all ${asset.publish_status === "published" ? "bg-neutral-800 text-neutral-400 hover:text-amber-400" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}
          title={asset.publish_status === "published" ? "Chuyển về Draft" : "Publish"}
        >
          {asset.publish_status === "published" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>

        {/* Retry if failed */}
        {(asset.status === "failed" || asset.status === "pending") && (
          <button
            onClick={() => onAction(asset.id, "retry")}
            className="px-2 py-1 rounded-lg text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
            title="Retry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* More menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="px-2 py-1 rounded-lg text-xs bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-all"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-50 w-44 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden" onMouseLeave={() => setMenuOpen(false)}>
              <button onClick={() => { onAction(asset.id, "reprocess"); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Reprocess
              </button>
              <button onClick={() => { onAction(asset.id, "edit"); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors">
                <Edit2 className="w-3.5 h-3.5" /> Sửa metadata
              </button>
              <div className="border-t border-neutral-800" />
              <button onClick={() => { onAction(asset.id, "delete"); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Xóa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Metadata Modal ─────────────────────────────────────────────────────

function EditMetaModal({ asset, playlists, onClose, onSave }: {
  asset: MediaAsset; playlists: Playlist[];
  onClose: () => void; onSave: (id: string, data: any) => void;
}) {
  const [title, setTitle] = useState(asset.title);
  const [language, setLanguage] = useState(asset.language || "en");
  const [level, setLevel] = useState(asset.level || "");
  const [category, setCategory] = useState(asset.category || "");
  const [playlistId, setPlaylistId] = useState(asset.playlist_id || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(asset.id, { title, language, level, category, playlist_id: playlistId || null });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 w-full max-w-md shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-white flex items-center gap-2"><Edit2 className="w-4 h-4 text-indigo-400" /> Sửa metadata</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">Tiêu đề</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Ngôn ngữ</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white outline-none">
                <option value="en">English</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="vi">Vietnamese</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Level</label>
              <select value={level} onChange={e => setLevel(e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white outline-none">
                <option value="">Tất cả</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">Danh mục</label>
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="VD: Business, Daily life..." className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">Playlist</label>
            <select value={playlistId} onChange={e => setPlaylistId(e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white outline-none">
              <option value="">-- Video lẻ --</option>
              {playlists.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-sm hover:bg-neutral-700 transition-colors">Hủy</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm hover:bg-indigo-600 transition-colors disabled:opacity-50">
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ActiveTab = "vocabulary" | "shadowing" | "upload" | "playlists";

export default function AdminLibraryPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("vocabulary");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [vocabAssets, setVocabAssets] = useState<MediaAsset[]>([]);
  const [shadowAssets, setShadowAssets] = useState<MediaAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [deleteConfirmPlaylist, setDeleteConfirmPlaylist] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<MediaAsset | null>(null);
  const [deleteConfirmMedia, setDeleteConfirmMedia] = useState<string | null>(null);

  // Upload state
  const [urls, setUrls] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [targetModule, setTargetModule] = useState<"vocabulary" | "shadowing">("vocabulary");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalUploads, setTotalUploads] = useState(0);
  const [uploadLogs, setUploadLogs] = useState<{ msg: string; type: "info" | "success" | "error" }[]>([]);

  // Filter state
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPublish, setFilterPublish] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchPlaylists();
    fetchAssets();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const data = await getPlaylists();
      setPlaylists(data || []);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const fetchAssets = async () => {
    setLoadingAssets(true);
    try {
      const { data } = await supabase
        .from("media_assets")
        .select("*")
        .in("status", ["ready", "pending", "processing", "failed"])
        .order("created_at", { ascending: false });

      setVocabAssets((data || []).filter((a: MediaAsset) => a.module === "vocabulary"));
      setShadowAssets((data || []).filter((a: MediaAsset) => a.module === "shadowing"));
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleBatchUpload = async () => {
    let list = urls.split("\n").map(u => u.trim()).filter(u => u.length > 10);
    if (!list.length) return;
    setUploading(true);
    setUploadLogs([]);

    // Check if there is a single playlist link to expand
    if (list.length === 1 && (list[0].includes('playlist?list=') || (list[0].includes('watch?') && list[0].includes('&list=')))) {
      try {
        setUploadLogs(prev => [...prev, { msg: `Phát hiện Playlist, đang lấy danh sách video...`, type: "info" }]);
        const res = await fetch(`/api/youtube/playlist?url=${encodeURIComponent(list[0])}`);
        const data = await res.json();
        if (data.videos && data.videos.length > 0) {
          list = data.videos.map((v: any) => v.url);
          setUploadLogs(prev => [...prev, { msg: `Đã tìm thấy ${list.length} video trong Playlist "${data.title}"`, type: "success" }]);
        } else {
          throw new Error("Không tìm thấy video nào");
        }
      } catch (err: any) {
        setUploadLogs(prev => [...prev, { msg: `Lỗi đọc playlist: ${err.message}`, type: "error" }]);
        setUploading(false);
        return;
      }
    }

    setTotalUploads(list.length);
    setProgress(0);

    for (let i = 0; i < list.length; i++) {
      const url = list[i];
      setUploadLogs(prev => [...prev, { msg: `[${i + 1}/${list.length}] Processing: ${url}`, type: "info" }]);
      try {
        await createAdminMediaJob({ sourceUrl: url, targetLanguage, playlistId: selectedPlaylistId || undefined, module: targetModule });
        setProgress(i + 1);
        setUploadLogs(prev => [...prev, { msg: `✓ Success: ${url}`, type: "success" }]);
      } catch (err: any) {
        setUploadLogs(prev => [...prev, { msg: `✗ Error: ${url} — ${err.message}`, type: "error" }]);
      }
    }
    setUploading(false);
    setUrls("");
    toast.success(`Đã submit ${list.length} video vào queue`);
    fetchAssets();
  };

  const handleAssetAction = async (id: string, action: string, value?: any) => {
    if (action === "edit") {
      const asset = [...vocabAssets, ...shadowAssets].find(a => a.id === id);
      if (asset) setEditTarget(asset);
      return;
    }
    if (action === "delete") {
      setDeleteConfirmMedia(id);
      return;
    }

    const toastId = toast.loading("Đang xử lý...");
    try {
      if (action === "toggle_publish") {
        const newStatus = value === "published" ? "draft" : "published";
        const isPublic = newStatus === "published";
        await supabase.from("media_assets").update({ publish_status: newStatus, is_public: isPublic }).eq("id", id);
        setVocabAssets(prev => prev.map(a => a.id === id ? { ...a, publish_status: newStatus, is_public: isPublic } : a));
        setShadowAssets(prev => prev.map(a => a.id === id ? { ...a, publish_status: newStatus, is_public: isPublic } : a));
        toast.success(newStatus === "published" ? "Đã publish" : "Đã chuyển về draft", { id: toastId });
      } else if (action === "retry" || action === "reprocess") {
        await fetch(`/api/admin/media/${id}/reprocess`, { method: "POST" });
        setVocabAssets(prev => prev.map(a => a.id === id ? { ...a, status: "pending" } : a));
        setShadowAssets(prev => prev.map(a => a.id === id ? { ...a, status: "pending" } : a));
        toast.success("Đã submit reprocess", { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message, { id: toastId });
    }
  };

  const handleDeleteMedia = async () => {
    if (!deleteConfirmMedia) return;
    const id = deleteConfirmMedia;
    setDeleteConfirmMedia(null);
    const toastId = toast.loading("Đang xóa...");
    try {
      await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      setVocabAssets(prev => prev.filter(a => a.id !== id));
      setShadowAssets(prev => prev.filter(a => a.id !== id));
      toast.success("Đã xóa", { id: toastId });
    } catch (e: any) {
      toast.error(e.message, { id: toastId });
    }
  };

  const handleSaveMeta = async (id: string, data: any) => {
    const toastId = toast.loading("Đang lưu...");
    try {
      await supabase.from("media_assets").update(data).eq("id", id);
      setVocabAssets(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
      setShadowAssets(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
      toast.success("Đã lưu metadata", { id: toastId });
    } catch (e: any) {
      toast.error(e.message, { id: toastId });
    }
  };

  const filterAssets = (assets: MediaAsset[]) => {
    return assets.filter(a => {
      if (filterStatus !== "all" && a.status !== filterStatus) return false;
      if (filterPublish !== "all" && a.publish_status !== filterPublish) return false;
      if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  };

  const currentAssets = filterAssets(activeTab === "vocabulary" ? vocabAssets : shadowAssets);
  const vocabStats = { total: vocabAssets.length, ready: vocabAssets.filter(a => a.status === "ready").length, published: vocabAssets.filter(a => a.publish_status === "published").length };
  const shadowStats = { total: shadowAssets.length, ready: shadowAssets.filter(a => a.status === "ready").length, published: shadowAssets.filter(a => a.publish_status === "published").length };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Edit metadata modal */}
      {editTarget && <EditMetaModal asset={editTarget} playlists={playlists} onClose={() => setEditTarget(null)} onSave={handleSaveMeta} />}

      {/* Delete media confirm */}
      {deleteConfirmMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirmMedia(null)}>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white mb-2">Xóa video này?</h3>
            <p className="text-xs text-neutral-400 mb-4">Video sẽ bị xóa khỏi hệ thống. Không thể hoàn tác.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirmMedia(null)} className="flex-1 px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-sm">Hủy</button>
              <button onClick={handleDeleteMedia} className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm hover:bg-red-600">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            Kho Video Hệ Thống
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">Quản lý video công khai cho Vocabulary và Shadowing</p>
        </div>
        <button onClick={fetchAssets} className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-400 hover:text-white transition-all">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={BookOpen} label="Vocabulary" color="text-emerald-400" total={vocabStats.total} ready={vocabStats.ready} published={vocabStats.published} />
        <StatCard icon={Zap} label="Shadowing" color="text-indigo-400" total={shadowStats.total} ready={shadowStats.ready} published={shadowStats.published} />
        <div className="p-4 rounded-xl border border-neutral-800/60 bg-[#0a0a0a]">
          <div className="text-xs text-neutral-500 mb-1">Tổng video</div>
          <div className="text-2xl font-bold text-white">{vocabStats.total + shadowStats.total}</div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-800/60 bg-[#0a0a0a]">
          <div className="text-xs text-neutral-500 mb-1">Đang publish</div>
          <div className="text-2xl font-bold text-emerald-400">{vocabStats.published + shadowStats.published}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-800/60">
        {([
          { id: "vocabulary", label: "Vocabulary", icon: BookOpen, count: vocabStats.total },
          { id: "shadowing", label: "Shadowing", icon: Zap, count: shadowStats.total },
          { id: "upload", label: "Upload", icon: Upload, count: null },
          { id: "playlists", label: "Playlists", icon: Layers, count: playlists.length },
        ] as { id: ActiveTab; label: string; icon: any; count: number | null }[]).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative ${activeTab === t.id ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === t.id ? "bg-indigo-500 text-white" : "bg-neutral-800 text-neutral-500"}`}>{t.count}</span>
            )}
            {activeTab === t.id && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-indigo-500 rounded-full" />}
          </button>
        ))}
      </div>

      {/* ── Tab: Vocabulary / Shadowing ── */}
      {(activeTab === "vocabulary" || activeTab === "shadowing") && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl">
              <Search className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Tìm theo tiêu đề..."
                className="bg-transparent outline-none text-sm text-neutral-300 placeholder-neutral-600 flex-1" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-400 outline-none">
              <option value="all">Tất cả status</option>
              <option value="ready">Ready</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select value={filterPublish} onChange={e => setFilterPublish(e.target.value)}
              className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-400 outline-none">
              <option value="all">Tất cả</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <span className="text-xs text-neutral-600">{currentAssets.length} video</span>
          </div>

          {/* Video list */}
          <div className="rounded-xl border border-neutral-800/60 bg-[#0a0a0a]">
            {loadingAssets ? (
              <div className="py-16 text-center text-neutral-600 text-sm">Đang tải...</div>
            ) : currentAssets.length === 0 ? (
              <div className="py-16 text-center">
                <Video className="w-10 h-10 text-neutral-800 mx-auto mb-3" />
                <p className="text-neutral-600 text-sm">Chưa có video nào</p>
                <button onClick={() => setActiveTab("upload")} className="mt-3 text-xs text-indigo-400 hover:underline">
                  Upload video đầu tiên →
                </button>
              </div>
            ) : (
              currentAssets.map(asset => (
                <VideoRow key={asset.id} asset={asset} playlists={playlists} onAction={handleAssetAction} />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Upload ── */}
      {activeTab === "upload" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 rounded-xl border border-neutral-800/60 bg-[#0a0a0a] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-neutral-800/60 bg-neutral-900/30 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Upload hàng loạt</h3>
            </div>
            <div className="p-5 space-y-4">
              {/* URLs */}
              <div>
                <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Link YouTube (Hỗ trợ Playlist hoặc mỗi dòng 1 link video)</label>
                <textarea
                  value={urls} onChange={e => setUrls(e.target.value)} disabled={uploading} rows={6}
                  placeholder={"Dán 1 link Playlist (https://youtube.com/playlist?list=...)\nHOẶC dán nhiều link video:\nhttps://youtube.com/watch?v=...\nhttps://youtube.com/watch?v=..."}
                  className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 focus:border-indigo-500 rounded-xl outline-none text-xs text-neutral-300 font-mono resize-none"
                />
                <div className="text-xs text-neutral-600 mt-1">{urls.split("\n").filter(u => u.trim().length > 10).length} link hợp lệ</div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 mb-1.5 block">Phòng đích *</label>
                  <select value={targetModule} onChange={e => setTargetModule(e.target.value as any)} disabled={uploading}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-indigo-500 rounded-xl text-xs text-white outline-none">
                    <option value="vocabulary">📖 Vocabulary</option>
                    <option value="shadowing">⚡ Shadowing</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-1.5 block">Ngôn ngữ</label>
                  <select value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)} disabled={uploading}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-indigo-500 rounded-xl text-xs text-white outline-none">
                    <option value="English">English</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Korean">Korean</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-1.5 block">Playlist</label>
                  <select value={selectedPlaylistId} onChange={e => setSelectedPlaylistId(e.target.value)} disabled={uploading}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-indigo-500 rounded-xl text-xs text-white outline-none">
                    <option value="">-- Video lẻ --</option>
                    {playlists.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              </div>

              <button
                onClick={handleBatchUpload}
                disabled={uploading || urls.trim().length === 0}
                className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploading ? `Đang upload ${progress}/${totalUploads}...` : "Upload hàng loạt"}
              </button>

              {/* Upload log */}
              {uploadLogs.length > 0 && (
                <div className="bg-black rounded-xl p-4 text-[10px] font-mono h-40 overflow-y-auto space-y-1 border border-neutral-800">
                  {uploadLogs.map((l, i) => (
                    <div key={i} className={l.type === "success" ? "text-emerald-400" : l.type === "error" ? "text-red-400" : "text-neutral-500"}>
                      {l.msg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Quy trình xử lý</span>
              </div>
              <ol className="space-y-2 text-xs text-neutral-400">
                <li className="flex gap-2"><span className="text-blue-400 font-bold shrink-0">1.</span> Download video từ YouTube</li>
                <li className="flex gap-2"><span className="text-blue-400 font-bold shrink-0">2.</span> Tạo subtitle (auto/manual)</li>
                <li className="flex gap-2"><span className="text-blue-400 font-bold shrink-0">3.</span> AI phân tích từ vựng / shadowing</li>
                <li className="flex gap-2"><span className="text-blue-400 font-bold shrink-0">4.</span> Deduplication check</li>
                <li className="flex gap-2"><span className="text-blue-400 font-bold shrink-0">5.</span> Lưu vào Library</li>
                <li className="flex gap-2"><span className="text-blue-400 font-bold shrink-0">6.</span> <strong>Admin publish</strong> → User thấy</li>
              </ol>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/80">
                  Video upload xong sẽ ở trạng thái <strong>Draft</strong>. Admin cần vào tab <strong>Vocabulary/Shadowing</strong> để Publish trước khi user thấy.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Playlists ── */}
      {activeTab === "playlists" && (
        <div className="rounded-xl border border-neutral-800/60 bg-[#0a0a0a] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-800/60 bg-neutral-900/30 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Quản lý Playlists</h3>
            <span className="text-xs text-neutral-600">{playlists.length} playlist</span>
          </div>
          <div className="p-5 space-y-4">
            {/* Create form */}
            <form onSubmit={async e => {
              e.preventDefault();
              if (!newTitle) return;
              const toastId = toast.loading("Đang tạo...");
              try {
                await createPlaylist(newTitle, "");
                setNewTitle("");
                fetchPlaylists();
                toast.success("Đã tạo playlist", { id: toastId });
              } catch { toast.error("Lỗi tạo playlist", { id: toastId }); }
            }} className="flex gap-2">
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Tên playlist mới..."
                className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-indigo-500 rounded-xl text-sm text-white outline-none" />
              <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-all">
                <Plus className="w-4 h-4" /> Tạo
              </button>
            </form>

            {/* Playlist list */}
            {loadingPlaylists ? (
              <div className="py-8 text-center text-neutral-600 text-sm">Đang tải...</div>
            ) : playlists.length === 0 ? (
              <div className="py-8 text-center text-neutral-600 text-sm">Chưa có playlist nào</div>
            ) : (
              <div className="divide-y divide-neutral-800/60">
                {playlists.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-200">{p.title}</p>
                      <p className="text-xs text-neutral-600">{new Date(p.created_at).toLocaleDateString("vi-VN")}</p>
                    </div>
                    <button onClick={() => setDeleteConfirmPlaylist(p.id)} className="p-2 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete playlist confirm */}
      {deleteConfirmPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirmPlaylist(null)}>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white mb-2">Xóa playlist?</h3>
            <p className="text-xs text-neutral-400 mb-4">Tất cả video trong playlist sẽ bị xóa. Không thể hoàn tác.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirmPlaylist(null)} className="flex-1 px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-sm">Hủy</button>
              <button onClick={async () => {
                const id = deleteConfirmPlaylist;
                setDeleteConfirmPlaylist(null);
                const toastId = toast.loading("Đang xóa...");
                try { await deletePlaylist(id); fetchPlaylists(); toast.success("Đã xóa", { id: toastId }); }
                catch { toast.error("Lỗi", { id: toastId }); }
              }} className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm hover:bg-red-600">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete media confirm */}
      {deleteConfirmMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirmMedia(null)}>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white mb-2">Xóa video?</h3>
            <p className="text-xs text-neutral-400 mb-4">Video này sẽ bị xóa khỏi hệ thống. Không thể hoàn tác.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirmMedia(null)} className="flex-1 px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-sm">Hủy</button>
              <button onClick={handleDeleteMedia} className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm hover:bg-red-600">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, color, total, ready, published }: {
  icon: any; label: string; color: string; total: number; ready: number; published: number;
}) {
  return (
    <div className="p-4 rounded-xl border border-neutral-800/60 bg-[#0a0a0a] space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs font-semibold text-neutral-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{total}</div>
      <div className="flex gap-3 text-[10px] text-neutral-600">
        <span>Ready: <strong className="text-neutral-400">{ready}</strong></span>
        <span>Published: <strong className="text-emerald-500">{published}</strong></span>
      </div>
    </div>
  );
}
