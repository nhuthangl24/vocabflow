"use client";

import { useState, useMemo } from "react";
import { Type, Search, BookOpen, Users, TrendingUp, Volume2, Tag, ChevronLeft, ChevronRight } from "lucide-react";

interface VocabItem {
  id: string;
  term: string;
  lemma: string | null;
  pronunciation: string | null;
  part_of_speech: string | null;
  level: string | null;
  meaning_vi: string | null;
  user_id: string;
  created_at: string;
}

interface Props {
  items: VocabItem[];
  totalCount: number;
  termCount: number;
  userCount: number;
  levelBreakdown: Record<string, number>;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  A2: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  B1: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  B2: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  C1: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  C2: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function VocabularyAdminClient({ items: initialItems, totalCount, termCount, userCount, levelBreakdown }: Props) {
  const [items] = useState<VocabItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [posFilter, setPosFilter] = useState("all");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.term.toLowerCase().includes(search.toLowerCase()) ||
        (item.meaning_vi?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchLevel = levelFilter === "all" || item.level === levelFilter;
      const matchPos = posFilter === "all" || item.part_of_speech === posFilter;
      return matchSearch && matchLevel && matchPos;
    });
  }, [items, search, levelFilter, posFilter]);

  const levels = ["all", ...Object.keys(levelBreakdown).filter(Boolean).sort()];
  const posTags = ["all", ...Array.from(new Set(items.map((i) => i.part_of_speech).filter(Boolean))) as string[]];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-5">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Type className="w-5 h-5 text-indigo-400" />
            Quản Lý Từ Vựng
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Toàn bộ từ vựng AI trích xuất từ video — dữ liệu thực tế
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-medium text-indigo-400">{totalCount.toLocaleString()} từ tổng</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-neutral-800/60 bg-[#0a0a0a]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Tổng từ vựng</div>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-semibold text-white">{totalCount.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-800/60 bg-[#0a0a0a]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Từ độc nhất</div>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-semibold text-white">{termCount.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-800/60 bg-[#0a0a0a]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Người dùng học</div>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-semibold text-white">{userCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-800/60 bg-[#0a0a0a]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Phân bổ cấp độ</div>
            <Tag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(levelBreakdown)
              .filter(([k]) => k)
              .sort(([a], [b]) => a.localeCompare(b))
              .slice(0, 4)
              .map(([level, count]) => (
                <span
                  key={level}
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                    LEVEL_COLORS[level] || "bg-neutral-800 text-neutral-400 border-neutral-700"
                  }`}
                >
                  {level}: {count}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm từ vựng hoặc nghĩa..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition-all"
        >
          {levels.map((l) => (
            <option key={l} value={l}>
              {l === "all" ? "Tất cả cấp độ" : l}
            </option>
          ))}
        </select>
        <select
          value={posFilter}
          onChange={(e) => setPosFilter(e.target.value)}
          className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition-all"
        >
          {posTags.map((p) => (
            <option key={p} value={p}>
              {p === "all" ? "Tất cả loại từ" : p}
            </option>
          ))}
        </select>
        <span className="text-xs text-neutral-500 ml-auto">
          Hiển thị {filtered.length}/{items.length} từ
        </span>
      </div>

      {/* Table */}
      <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="text-xs text-neutral-500 bg-neutral-900/90 backdrop-blur-md uppercase tracking-wider border-b border-neutral-800/60 sticky top-0 z-10 shadow-sm shadow-black/20">
              <tr>
                <th className="px-5 py-3.5 font-medium">Từ vựng</th>
                <th className="px-5 py-3.5 font-medium">Nghĩa (VI)</th>
                <th className="px-5 py-3.5 font-medium">Loại từ</th>
                <th className="px-5 py-3.5 font-medium">Cấp độ</th>
                <th className="px-5 py-3.5 font-medium">Phát âm</th>
                <th className="px-5 py-3.5 font-medium">User</th>
                <th className="px-5 py-3.5 font-medium">Ngày</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-900/30 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="font-semibold text-white">{item.term}</div>
                    {item.lemma && item.lemma !== item.term && (
                      <div className="text-[11px] text-neutral-500">({item.lemma})</div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-neutral-300 max-w-[200px] truncate">
                    {item.meaning_vi || "—"}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {item.part_of_speech ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border bg-neutral-800 text-neutral-300 border-neutral-700 uppercase">
                        {item.part_of_speech}
                      </span>
                    ) : (
                      <span className="text-neutral-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {item.level ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
                          LEVEL_COLORS[item.level] || "bg-neutral-800 text-neutral-400 border-neutral-700"
                        }`}
                      >
                        {item.level}
                      </span>
                    ) : (
                      <span className="text-neutral-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-neutral-500 font-mono text-xs">
                    {item.pronunciation ? (
                      <span className="flex items-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        {item.pronunciation}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-neutral-500 font-mono text-xs">
                    {item.user_id.slice(0, 8)}…
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-neutral-500 text-xs">
                    {new Date(item.created_at).toLocaleDateString("vi-VN")}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-neutral-500">
                    {search || levelFilter !== "all" || posFilter !== "all"
                      ? "Không tìm thấy từ vựng nào phù hợp."
                      : "Chưa có dữ liệu từ vựng."}
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
