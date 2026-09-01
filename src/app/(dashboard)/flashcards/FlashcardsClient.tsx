"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlayCircle, Target, Trophy, Clock, LibraryBig, Plus, Folders, Flame, X, Loader2, FolderPlus, Settings, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { updateFlashcardLimit } from "@/app/actions/userSettings";
import AddCardsModal from "@/components/flashcards/AddCardsModal";

type Stats = {
  total: number;
  new: number;
  learning: number;
  review: number;
  due: number;
  userLimit?: number;
};

export default function FlashcardsClient({ stats }: { stats: Stats }) {
  const [decks, setDecks] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddCardsModal, setShowAddCardsModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDesc, setNewDeckDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  const [userLimit, setUserLimit] = useState(stats.userLimit ?? 50);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newLimit, setNewLimit] = useState(userLimit.toString());
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: string, name: string } | null>(null);

  const handleUpdateSettings = async () => {
    const parsedLimit = parseInt(newLimit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 0) {
      toast.error("Vui lòng nhập số hợp lệ.");
      return;
    }
    setIsUpdatingSettings(true);
    const res = await updateFlashcardLimit(parsedLimit);
    if (res.success) {
      toast.success("Đã cập nhật giới hạn thẻ.");
      setUserLimit(parsedLimit);
      setShowSettingsModal(false);
    } else {
      toast.error(res.error || "Có lỗi xảy ra");
    }
    setIsUpdatingSettings(false);
  };

  const loadDecks = () => {
    fetch("/api/user/flashcards/decks")
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setDecks(data.decks || []);
        }
      });
  };

  useEffect(() => {
    loadDecks();
  }, []);

  const handleDeleteDeck = async () => {
    if (!deleteModal) return;
    
    const toastId = toast.loading("Đang xoá...");
    try {
      const res = await fetch(`/api/user/flashcards/decks/${deleteModal.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Đã xoá bộ thẻ", { id: toastId });
        setDeleteModal(null);
        loadDecks();
      } else {
        toast.error("Không thể xoá bộ thẻ", { id: toastId });
      }
    } catch (e) {
      toast.error("Lỗi mạng", { id: toastId });
    }
  };

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/user/flashcards/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDeckName.trim(), description: newDeckDesc.trim() || undefined })
      });
      const d = await res.json();
      if (d.success) {
        setDecks(prev => [d.deck, ...prev]);
        toast.success(`Đã tạo bộ thẻ "${newDeckName.trim()}"!`);
        setShowCreateModal(false);
        setNewDeckName("");
        setNewDeckDesc("");
      } else {
        toast.error(d.error || "Có lỗi xảy ra");
      }
    } catch (e) {
      toast.error("Lỗi mạng");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Create Deck Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !isCreating && setShowCreateModal(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-neutral-700 animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                  <FolderPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tạo bộ thẻ mới</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={isCreating}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-2">
                  Tên bộ thẻ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newDeckName}
                  onChange={e => setNewDeckName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreateDeck()}
                  placeholder="VD: Từ vựng tiếng Trung HSK3"
                  maxLength={80}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-2">
                  Mô tả <span className="text-slate-400 font-normal">(tuỳ chọn)</span>
                </label>
                <textarea
                  value={newDeckDesc}
                  onChange={e => setNewDeckDesc(e.target.value)}
                  placeholder="Mô tả ngắn về bộ thẻ này..."
                  rows={2}
                  maxLength={200}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 pt-0">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={isCreating}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleCreateDeck}
                disabled={!newDeckName.trim() || isCreating}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isCreating ? "Đang tạo..." : "Tạo bộ thẻ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Target className="w-16 h-16 text-indigo-500" />
          </div>
          <div className="text-sm font-bold text-slate-500 dark:text-neutral-400 mb-2">Cần ôn hôm nay</div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{stats.due}</div>
        </div>
        
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="text-sm font-bold text-slate-500 dark:text-neutral-400 mb-2">Thẻ mới</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.new}</div>
        </div>
        
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="text-sm font-bold text-slate-500 dark:text-neutral-400 mb-2">Đang học</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.learning}</div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="text-sm font-bold text-slate-500 dark:text-neutral-400 mb-2">Thành thạo</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{stats.review}</div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="text-sm font-bold text-slate-500 dark:text-neutral-400 mb-2 flex items-center gap-1"><Flame className="w-4 h-4 text-orange-500"/> Streak</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">0 <span className="text-sm font-medium text-slate-400">ngày</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Folders className="w-5 h-5 text-slate-400" />
              Bộ thẻ (Decks)
            </h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowAddCardsModal(true)}
                className="flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:dark:text-emerald-300 transition-colors bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg"
              >
                <Plus className="w-4 h-4" /> Thêm từ vựng
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:dark:text-indigo-300 transition-colors"
              >
                <FolderPlus className="w-4 h-4" /> Tạo Deck
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl p-5 border border-slate-200 dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors cursor-pointer group">
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">All Flashcards (Mặc định)</h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">Toàn bộ từ vựng đã lưu từ video.</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-bold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 px-2 py-1 rounded">{stats.total} thẻ</span>
                <Link href="/flashcards/library" className="text-xs font-semibold text-indigo-600 hover:underline">Xem thư viện</Link>
              </div>
            </div>

            {decks.map(d => (
              <div key={d.id} className="relative bg-white dark:bg-[#0a0a0a] rounded-xl p-5 border border-slate-200 dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors cursor-pointer group flex flex-col justify-between">
                <button 
                  onClick={(e) => { e.stopPropagation(); setDeleteModal({ id: d.id, name: d.name }); }}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 dark:text-neutral-600 dark:hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 z-10"
                  title="Xoá bộ thẻ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 pr-8">{d.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">{d.description || 'Không có mô tả'}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-bold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 px-2 py-1 rounded">{d.flashcards?.[0]?.count || 0} thẻ</span>
                  <Link href={`/flashcards/study/${d.id}`} className="text-xs font-semibold text-indigo-600 hover:underline">Học ngay</Link>
                </div>
              </div>
            ))}

            {/* Create new deck card shortcut */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white dark:bg-[#0a0a0a] rounded-xl p-5 border-2 border-dashed border-slate-200 dark:border-neutral-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-neutral-600 hover:text-indigo-500 dark:hover:text-indigo-400 min-h-[110px]"
            >
              <Plus className="w-6 h-6" />
              <span className="text-sm font-semibold">Tạo bộ thẻ mới</span>
            </button>
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
             <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Mục tiêu hôm nay
               </h3>
               <button 
                 onClick={() => {
                   setNewLimit(userLimit.toString());
                   setShowSettingsModal(true);
                 }}
                 className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 hover:bg-indigo-50 dark:bg-neutral-900/50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                 title="Cài đặt giới hạn ôn tập"
               >
                 <Settings className="w-4 h-4" />
               </button>
             </div>
             <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span className="text-slate-600 dark:text-neutral-400">Ôn tập thẻ cũ</span>
                    <span className="text-slate-900 dark:text-white">0 / {stats.due}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span className="text-slate-600 dark:text-neutral-400">Học từ mới</span>
                    <span className="text-slate-900 dark:text-white">0 / {userLimit > 0 ? userLimit : '∞'}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-neutral-800/50">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-red-500">
                Xác nhận xoá
              </h3>
              <button 
                onClick={() => setDeleteModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-slate-700 dark:text-neutral-300 text-sm">
                Bạn có chắc chắn muốn xoá bộ thẻ <strong>"{deleteModal.name}"</strong> không? Mọi thẻ trong bộ này cũng sẽ bị xoá vĩnh viễn!
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-neutral-900/50 border-t border-slate-100 dark:border-neutral-800 flex justify-end gap-3">
              <button 
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                Huỷ
              </button>
              <button 
                onClick={handleDeleteDeck}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-colors"
              >
                Xoá bộ thẻ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-neutral-800/50">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-500" />
                Cài đặt ôn tập
              </h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1">Giới hạn thẻ mỗi phiên học</label>
                <p className="text-xs text-slate-500 dark:text-neutral-500 mb-3">
                  Nhập số lượng thẻ tối đa (nhập 0 để học toàn bộ không giới hạn).
                </p>
                <input 
                  type="number" 
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white font-medium"
                  placeholder="VD: 50"
                  min="0"
                  max="1000"
                />
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-neutral-900/50 border-t border-slate-100 dark:border-neutral-800 flex justify-end gap-3">
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleUpdateSettings}
                disabled={isUpdatingSettings}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUpdatingSettings && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu cài đặt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Cards Modal */}
      {showAddCardsModal && (
        <AddCardsModal 
          collections={decks} 
          onClose={() => setShowAddCardsModal(false)} 
          onSuccess={() => {
            fetch("/api/user/flashcards/decks")
              .then(r => r.json())
              .then(d => setDecks(d.data || []));
          }} 
        />
      )}
    </div>
  );
}
