"use client";

import { useState } from "react";
import Link from "next/link";
import { Folder, MoreVertical, Plus, Edit, Trash2, Globe2, BookOpen, Loader2, X, Archive, Copy } from "lucide-react";
import toast from "react-hot-toast";

type Collection = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  source_language: string;
  target_language: string;
  flashcards: { count: number }[];
};

export default function CollectionsClient({ initialCollections }: { initialCollections: Collection[] }) {
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceLang, setSourceLang] = useState("en-US");
  const [targetLang, setTargetLang] = useState("vi-VN");

  const openCreateModal = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setSourceLang("en-US");
    setTargetLang("vi-VN");
    setShowModal(true);
  };

  const openEditModal = (c: Collection) => {
    setEditingId(c.id);
    setName(c.name);
    setDescription(c.description || "");
    setSourceLang(c.source_language || "en-US");
    setTargetLang(c.target_language || "vi-VN");
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = { 
        name: name.trim(), 
        description: description.trim(), 
        source_language: sourceLang, 
        target_language: targetLang 
      };
      
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/user/flashcards/decks/${editingId}` : `/api/user/flashcards/decks`;
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "Đã cập nhật Collection!" : "Đã tạo Collection!");
        if (editingId) {
          setCollections(prev => prev.map(c => c.id === editingId ? { ...c, ...data.deck } : c));
        } else {
          setCollections(prev => [data.deck, ...prev]);
        }
        setShowModal(false);
      } else {
        toast.error(data.error || "Có lỗi xảy ra");
      }
    } catch (e) {
      toast.error("Lỗi mạng");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xoá Collection "${name}"? Toàn bộ thẻ trong này sẽ bị mất.`)) return;
    try {
      const res = await fetch(`/api/user/flashcards/decks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCollections(prev => prev.filter(c => c.id !== id));
        toast.success("Đã xoá Collection");
      } else {
        toast.error("Không thể xoá");
      }
    } catch (e) {
      toast.error("Lỗi mạng");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Tạo Collection
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {collections.map(c => (
          <div key={c.id} className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all group flex flex-col h-full">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color ? `bg-${c.color}-100 text-${c.color}-600 dark:bg-${c.color}-500/10 dark:text-${c.color}-400` : 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300'}`}>
                {c.icon ? <span className="text-xl">{c.icon}</span> : <Folder className="w-5 h-5" />}
              </div>
              
              {/* Dropdown Menu (Simplified with hover for now) */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditModal(c)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="Sửa">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Xoá">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{c.name}</h3>
            {c.description && <p className="text-sm text-slate-500 dark:text-neutral-400 line-clamp-2 mb-4 flex-1">{c.description}</p>}
            
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-neutral-400">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {c.flashcards?.[0]?.count || 0} từ
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-neutral-900 px-2 py-1 rounded-md border border-slate-200/50 dark:border-neutral-800">
                <Globe2 className="w-3.5 h-3.5" />
                <span>{c.source_language?.split('-')[0].toUpperCase()}</span>
                <span className="text-slate-300 mx-0.5">→</span>
                <span>{c.target_language?.split('-')[0].toUpperCase()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => !isSubmitting && setShowModal(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-neutral-700 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-neutral-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingId ? "Sửa Collection" : "Tạo Collection mới"}</h2>
              <button onClick={() => setShowModal(false)} disabled={isSubmitting} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-neutral-300">Tên Collection <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-neutral-300">Mô tả</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 dark:text-neutral-300">Ngôn ngữ nguồn</label>
                  <select 
                    value={sourceLang} 
                    onChange={e => setSourceLang(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  >
                    <option value="en-US">English</option>
                    <option value="zh-CN">Chinese</option>
                    <option value="ja-JP">Japanese</option>
                    <option value="ko-KR">Korean</option>
                    <option value="fr-FR">French</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 dark:text-neutral-300">Ngôn ngữ đích</label>
                  <select 
                    value={targetLang} 
                    onChange={e => setTargetLang(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  >
                    <option value="vi-VN">Vietnamese</option>
                    <option value="en-US">English</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 pt-0">
              <button onClick={() => setShowModal(false)} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                Huỷ
              </button>
              <button onClick={handleSubmit} disabled={!name.trim() || isSubmitting} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? "Lưu thay đổi" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
