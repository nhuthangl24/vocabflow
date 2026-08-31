"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Star, PlayCircle, MoreVertical, Bookmark, Trash2, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

type Flashcard = {
  id: string;
  term: string;
  meaning: string;
  pronunciation: string;
  part_of_speech: string;
  difficulty: string;
  is_favorite: boolean;
  state: number; // 0: New, 1: Learning, 2: Review, 3: Relearning
  next_review_at: string;
  flashcard_decks?: { name: string };
};

export default function LibraryClient() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/user/flashcards").then(r => r.json()),
      fetch("/api/user/flashcards/decks").then(r => r.json())
    ]).then(([cardsData, decksData]) => {
      if (cardsData.success) setCards(cardsData.cards || []);
      if (decksData.success) setCollections(decksData.decks || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCards = cards.filter(c => 
    c.term.toLowerCase().includes(search.toLowerCase()) || 
    c.meaning.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
  const paginatedCards = filteredCards.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStateLabel = (state: number) => {
    switch (state) {
      case 0: return <span className="px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400 rounded text-xs font-semibold">Mới</span>;
      case 1: 
      case 3: return <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded text-xs font-semibold">Đang học</span>;
      case 2: return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded text-xs font-semibold">Thành thạo</span>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a]">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm từ vựng, ý nghĩa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors">
                <Filter className="w-4 h-4" /> Lọc
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-500">Đang tải dữ liệu...</div>
            ) : filteredCards.length === 0 ? (
              <div className="p-12 text-center text-slate-500">Không tìm thấy thẻ nào.</div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-neutral-900/50 border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 sticky top-0 z-10">
                  <tr>
                    <th className="w-10 px-4 py-3 text-center"><Star className="w-4 h-4 mx-auto" /></th>
                    <th className="px-4 py-3 font-semibold">Từ vựng</th>
                    <th className="px-4 py-3 font-semibold">Nghĩa</th>
                    <th className="px-4 py-3 font-semibold">Độ khó</th>
                    <th className="px-4 py-3 font-semibold">Bộ thẻ</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold">Lần ôn kế tiếp</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
                  {paginatedCards.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-neutral-900/50 transition-colors group cursor-pointer">
                      <td className="px-4 py-3 text-center">
                        <button className="text-slate-300 hover:text-amber-400 dark:text-neutral-600 dark:hover:text-amber-500 transition-colors">
                          <Star className={`w-4 h-4 ${c.is_favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{c.term}</div>
                        {c.pronunciation && <div className="text-xs font-mono text-slate-500 dark:text-neutral-500">/{c.pronunciation}/</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-neutral-300 max-w-[200px] truncate" title={c.meaning}>
                        <span className="font-semibold text-xs text-indigo-500 mr-1">{c.part_of_speech}</span>
                        {c.meaning}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 rounded font-semibold text-xs border border-slate-200 dark:border-neutral-700">
                          {c.difficulty || 'A1'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">
                        {c.flashcard_decks?.name || 'Mặc định'}
                      </td>
                      <td className="px-4 py-3">
                        {getStateLabel(c.state)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-neutral-400 text-xs">
                        {c.next_review_at ? new Date(c.next_review_at).toLocaleDateString('vi-VN') : 'Chưa xếp lịch'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 shrink-0">
              <div className="text-sm text-slate-500 dark:text-neutral-400">
                Hiển thị <span className="font-semibold text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-semibold text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredCards.length)}</span> trong số <span className="font-semibold text-slate-900 dark:text-white">{filteredCards.length}</span> thẻ
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-sm font-medium text-slate-700 dark:text-neutral-300 px-2">
                  Trang {currentPage} / {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
