"use client";

import { useState, useMemo } from "react";
import { BookOpen, Search, Filter } from "lucide-react";

interface GrammarItem {
  id: string;
  structure: string;
  user_id: string;
  level: string | null;
  explanation_vi: string | null;
  created_at: string;
}

interface Props {
  items: GrammarItem[];
  totalCount: number;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  A2: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  B1: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  B2: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  C1: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  C2: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export function GrammarAdminClient({ items, totalCount }: Props) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.structure.toLowerCase().includes(search.toLowerCase()) ||
        (item.explanation_vi?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchLevel = levelFilter === "all" || item.level === levelFilter;
      return matchSearch && matchLevel;
    });
  }, [items, search, levelFilter]);

  const levels = ["all", ...Array.from(new Set(items.map((i) => i.level).filter(Boolean))) as string[]].sort();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Grammar Engine</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Quản lý cấu trúc ngữ pháp AI trích xuất — {totalCount} cấu trúc tổng
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition-all"
          >
            {levels.map((l) => (
              <option key={l} value={l}>
                {l === "all" ? "Tất cả cấp độ" : l}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm cấu trúc ngữ pháp..."
              className="pl-9 pr-4 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-64 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-neutral-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Tổng cấu trúc ngữ pháp</div>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-semibold text-white">{totalCount}</div>
        </div>
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-neutral-900/50">
          <div className="text-sm font-medium text-neutral-400 mb-2">Đang hiển thị</div>
          <div className="text-2xl font-semibold text-white">{filtered.length}</div>
        </div>
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-neutral-900/50">
          <div className="text-sm font-medium text-neutral-400 mb-2">Cấp độ</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {levels
              .filter((l) => l !== "all")
              .map((l) => (
                <button
                  key={l}
                  onClick={() => setLevelFilter(l === levelFilter ? "all" : l)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all ${
                    levelFilter === l
                      ? (LEVEL_COLORS[l] || "bg-indigo-500/10 text-indigo-400 border-indigo-500/20")
                      : "bg-neutral-800 text-neutral-500 border-neutral-700 hover:border-neutral-600"
                  }`}
                >
                  {l}
                </button>
              ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden">
        <table className="w-full text-left text-sm text-neutral-400">
          <thead className="text-xs text-neutral-500 bg-neutral-900/50 uppercase tracking-wider border-b border-neutral-800/60">
            <tr>
              <th className="px-6 py-4 font-medium">Cấu trúc</th>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Cấp độ</th>
              <th className="px-6 py-4 font-medium">Giải thích</th>
              <th className="px-6 py-4 font-medium">Ngày</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-neutral-900/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{item.structure}</td>
                <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">{item.user_id.slice(0, 8)}…</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.level ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        LEVEL_COLORS[item.level] || "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                      }`}
                    >
                      {item.level}
                    </span>
                  ) : (
                    <span className="text-neutral-600">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap truncate max-w-[300px]">{item.explanation_vi || "—"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-neutral-500">
                  {new Date(item.created_at).toLocaleDateString("vi-VN")}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                  {search || levelFilter !== "all" ? "Không tìm thấy kết quả phù hợp." : "Chưa có dữ liệu ngữ pháp."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
