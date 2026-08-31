"use client";

import { useState, useOptimistic, useTransition } from "react";
import { ToggleRight, ToggleLeft, Plus, Trash2, Users, Percent, Search } from "lucide-react";
import { toggleFeatureFlag, createFeatureFlag, deleteFeatureFlag } from "./actions";

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number;
  allowed_emails: string[];
  created_at: string;
  updated_at: string;
}

interface Props {
  flags: FeatureFlag[];
}

function FlagRow({
  flag,
  onToggle,
  onDelete,
  pending,
}: {
  flag: FeatureFlag;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  return (
    <tr className="hover:bg-neutral-900/30 transition-colors group">
      <td className="px-5 py-4">
        <div className="font-semibold text-white text-sm">{flag.name}</div>
        <div className="font-mono text-xs text-neutral-500 mt-0.5">{flag.key}</div>
      </td>
      <td className="px-5 py-4 text-sm text-neutral-400 max-w-[250px]">
        {flag.description || <span className="text-neutral-600">—</span>}
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-sm text-neutral-400">
          <Percent className="w-3.5 h-3.5" />
          {flag.rollout_percentage}%
        </div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        {flag.allowed_emails.length > 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Users className="w-3.5 h-3.5" />
            {flag.allowed_emails.length} email
          </div>
        ) : (
          <span className="text-xs text-neutral-600">Tất cả</span>
        )}
      </td>
      <td className="px-5 py-4 whitespace-nowrap text-xs text-neutral-500">
        {new Date(flag.updated_at).toLocaleDateString("vi-VN")}
      </td>
      <td className="px-5 py-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => onToggle(flag.id, flag.enabled)}
            disabled={pending}
            className="flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50"
            title={flag.enabled ? "Tắt flag" : "Bật flag"}
          >
            {flag.enabled ? (
              <ToggleRight className="w-7 h-7 text-emerald-400 hover:text-emerald-300" />
            ) : (
              <ToggleLeft className="w-7 h-7 text-neutral-600 hover:text-neutral-400" />
            )}
          </button>
          <button
            onClick={() => onDelete(flag.id)}
            disabled={pending}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10 text-neutral-600 hover:text-red-400 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function FeatureFlagsClient({ flags: initialFlags }: Props) {
  const [flags, setFlags] = useState(initialFlags);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = flags.filter(
    (f) =>
      !search ||
      f.key.toLowerCase().includes(search.toLowerCase()) ||
      f.name.toLowerCase().includes(search.toLowerCase())
  );

  const enabledCount = flags.filter((f) => f.enabled).length;

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    setPendingId(id);
    // Optimistic update
    setFlags((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !currentEnabled, updated_at: new Date().toISOString() } : f))
    );
    try {
      await toggleFeatureFlag(id, !currentEnabled);
    } catch {
      // Revert on error
      setFlags((prev) =>
        prev.map((f) => (f.id === id ? { ...f, enabled: currentEnabled } : f))
      );
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa feature flag này?")) return;
    setDeleteId(id);
    try {
      await deleteFeatureFlag(id);
      setFlags((prev) => prev.filter((f) => f.id !== id));
    } finally {
      setDeleteId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newName) return;
    setCreating(true);
    try {
      const created = await createFeatureFlag({ key: newKey, name: newName, description: newDesc });
      if (created) {
        setFlags((prev) => [created, ...prev]);
        setNewKey("");
        setNewName("");
        setNewDesc("");
        setShowCreate(false);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-5">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <ToggleRight className="w-5 h-5 text-indigo-400" />
            Cờ Tính Năng
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Bật/tắt tính năng theo rollout percentage và email allowlist
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-medium text-emerald-400">{enabledCount}/{flags.length} đang bật</span>
          </div>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm flag
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-3"
        >
          <h3 className="text-sm font-medium text-neutral-200 mb-3">Tạo Feature Flag Mới</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Key (unique, snake_case)</label>
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                placeholder="vd: ai_coach"
                required
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Tên hiển thị</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="vd: AI Learning Coach"
                required
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Mô tả (tùy chọn)</label>
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Mô tả ngắn về tính năng..."
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {creating ? "Đang tạo..." : "Tạo flag"}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm flag..."
          className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="text-xs text-neutral-500 bg-neutral-900/40 uppercase tracking-wider border-b border-neutral-800/60">
              <tr>
                <th className="px-5 py-3.5 font-medium">Flag</th>
                <th className="px-5 py-3.5 font-medium">Mô tả</th>
                <th className="px-5 py-3.5 font-medium">Rollout</th>
                <th className="px-5 py-3.5 font-medium">Allowlist</th>
                <th className="px-5 py-3.5 font-medium">Cập nhật</th>
                <th className="px-5 py-3.5 font-medium text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filtered.map((flag) => (
                <FlagRow
                  key={flag.id}
                  flag={flag}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  pending={pendingId === flag.id || deleteId === flag.id}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-neutral-500">
                    {search ? "Không tìm thấy flag nào." : "Chưa có feature flag nào."}
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
