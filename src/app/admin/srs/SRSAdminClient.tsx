"use client";

import { useState, useMemo } from "react";
import { BrainCircuit, Search, BookOpen } from "lucide-react";

interface Flashcard {
  id: string;
  term: string;
  user_id: string;
  state: number;
  stability: number | null;
  difficulty: number | null;
  next_review_at: string | null;
  created_at: string;
}

interface Props {
  flashcards: Flashcard[];
  totalCards: number;
  totalReviews: number;
}

const STATE_LABELS = ["New", "Learning", "Review", "Relearning"];
const STATE_COLORS = [
  "bg-neutral-800 text-neutral-400 border-neutral-700",
  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "bg-red-500/10 text-red-400 border-red-500/20",
];

export function SRSAdminClient({ flashcards, totalCards, totalReviews }: Props) {
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");

  const filtered = useMemo(() => {
    return flashcards.filter((card) => {
      const matchSearch = !search || card.term.toLowerCase().includes(search.toLowerCase());
      const matchState = stateFilter === "all" || card.state === Number(stateFilter);
      return matchSearch && matchState;
    });
  }, [flashcards, search, stateFilter]);

  const stateCounts = [0, 1, 2, 3].map(
    (s) => flashcards.filter((c) => c.state === s).length
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">FSRS & Vocabulary</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Quản lý trạng thái ôn tập và chỉ số ghi nhớ
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="all">Tất cả trạng thái</option>
            {STATE_LABELS.map((l, i) => (
              <option key={i} value={i}>{l} ({stateCounts[i]})</option>
            ))}
          </select>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm từ vựng..."
              className="pl-9 pr-4 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 w-64 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-neutral-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Tổng Flashcards</div>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-semibold text-white">{totalCards}</div>
        </div>
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-neutral-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Tổng lượt ôn</div>
            <BrainCircuit className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-semibold text-white">{totalReviews}</div>
        </div>
        {[2, 0].map((s) => (
          <div key={s} className="p-5 rounded-xl border border-neutral-800/60 bg-neutral-900/50">
            <div className="text-sm font-medium text-neutral-400 mb-2">{STATE_LABELS[s]}</div>
            <div className="text-2xl font-semibold text-white">{stateCounts[s]}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden">
        <table className="w-full text-left text-sm text-neutral-400">
          <thead className="text-xs text-neutral-500 bg-neutral-900/50 uppercase tracking-wider border-b border-neutral-800/60">
            <tr>
              <th className="px-6 py-4 font-medium">Term</th>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">FSRS State</th>
              <th className="px-6 py-4 font-medium">Stability (S)</th>
              <th className="px-6 py-4 font-medium">Difficulty (D)</th>
              <th className="px-6 py-4 font-medium">Next Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {filtered.map((card) => (
              <tr key={card.id} className="hover:bg-neutral-900/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{card.term}</td>
                <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">{card.user_id.slice(0, 8)}…</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATE_COLORS[card.state] || STATE_COLORS[0]}`}>
                    {STATE_LABELS[card.state] || "Unknown"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{Number(card.stability || 0).toFixed(2)} d</td>
                <td className="px-6 py-4 whitespace-nowrap text-amber-400">{Number(card.difficulty || 0).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-neutral-500">
                  {card.next_review_at ? new Date(card.next_review_at).toLocaleDateString("vi-VN") : "Pending"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                  {search || stateFilter !== "all" ? "Không tìm thấy kết quả." : "Chưa có dữ liệu flashcard."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
