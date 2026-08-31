"use client";

import { useState, useCallback } from "react";
import { Plus, Save, Undo, Wand2, Trash2, GripVertical, Copy, X, FileText, LayoutGrid, Zap, Lightbulb, ArrowDown, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

type Row = {
  id: string;
  term: string;
  pronunciation: string;
  meaning: string;
  part_of_speech: string;
  example: string;
  example_translation: string;
  notes: string;
  tags: string;
  cefr: string;
};

const createEmptyRow = (): Row => ({
  id: Math.random().toString(36).substring(7),
  term: "",
  pronunciation: "",
  meaning: "",
  part_of_speech: "",
  example: "",
  example_translation: "",
  notes: "",
  tags: "",
  cefr: "",
});

export default function AddCardsModal({ collections, onClose, onSuccess }: { collections: any[], onClose: () => void, onSuccess?: () => void }) {
  const [activeTab, setActiveTab] = useState<'paste' | 'spreadsheet'>('paste');
  const [selectedCollection, setSelectedCollection] = useState<string>(collections[0]?.id || "");
  const [isSaving, setIsSaving] = useState(false);

  // Paste State
  const [inputText, setInputText] = useState("");
  const [parsedCards, setParsedCards] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptLang, setPromptLang] = useState("tiếng Anh");

  const promptTemplate = `Bạn là một chuyên gia ngôn ngữ học. Hãy tạo cho tôi một danh sách 20 từ vựng ${promptLang} về chủ đề [CHỦ ĐỀ CỦA BẠN].
Yêu cầu định dạng bảng (tabular) nhưng sử dụng dấu gạch đứng (|) để phân cách các cột. KHÔNG dùng markdown table, KHÔNG có dòng tiêu đề.
Mỗi dòng 1 từ vựng. Cần có chính xác 9 cột theo đúng thứ tự sau:
Từ vựng | Phát âm IPA | Nghĩa tiếng Việt | Loại từ (${promptLang}) | Câu ví dụ ${promptLang} | Dịch câu ví dụ | Tags (từ đồng nghĩa) | CEFR | Ghi chú

Ví dụ format:
abandon | /əˈbæn.dən/ | từ bỏ | verb | She abandoned her car | Cô ấy đã bỏ lại chiếc xe của mình | leave, desert | B2 | thường dùng trong văn viết
ability | /əˈbɪl.ə.ti/ | khả năng | noun | He has great ability | Anh ấy có khả năng tuyệt vời | skill, talent | A2 | `;

  const copyPrompt = () => {
    navigator.clipboard.writeText(promptTemplate);
    toast.success("Đã copy Prompt!");
  };

  // Spreadsheet State
  const [rows, setRows] = useState<Row[]>([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
  const [history, setHistory] = useState<Row[][]>([]);

  // ─── Paste Logic ─────────────────────────────────────────────────────────────
  const handleParse = () => {
    if (!inputText.trim()) return toast.error("Vui lòng nhập văn bản");
    setIsProcessing(true);
    
    const lines = inputText.split("\n").filter(l => l.trim().length > 0);
    const cards = lines.map(line => {
      let parts = line.split("|").map(p => p.trim());
      if (parts.length < 2) parts = line.split("\t").map(p => p.trim());
      if (parts.length < 2) parts = line.split(" - ").map(p => p.trim());
      
      // Map exactly to the 9 columns of Spreadsheet
      // 0: Từ vựng
      // 1: Phát âm
      // 2: Nghĩa
      // 3: Loại từ
      // 4: Ví dụ
      // 5: Dịch ví dụ
      // 6: Tags
      // 7: CEFR
      // 8: Ghi chú
      
      let term = parts[0] || "";
      let pronunciation = parts[1] || "";
      let meaning = parts[2] || "";
      let part_of_speech = parts[3] || "";
      let example = parts[4] || "";
      let example_translation = parts[5] || "";
      let tags = parts[6] || "";
      let cefr = parts[7] || "";
      let notes = parts[8] || "";

      // Fallback for old format (Từ vựng | phiên âm | loại từ | nghĩa | ví dụ)
      if (parts.length > 2 && parts.length <= 6 && (parts[1]?.startsWith("/") || parts[2]?.length < 15)) {
          // If part 2 looks like a part of speech (short string, no spaces) and part 3 looks like meaning
          if (parts[2] && !parts[2].includes(" ") && parts[2].length < 15) {
              part_of_speech = parts[2] || "";
              meaning = parts[3] || "";
          }
      }

      return {
        term,
        pronunciation,
        meaning,
        part_of_speech,
        example,
        example_translation,
        tags,
        cefr,
        notes
      };
    }).filter(c => c.term);

    setParsedCards(cards);
    setIsProcessing(false);
    toast.success(`Đã phân tích được ${cards.length} thẻ`);
  };

  const handleSavePaste = async () => {
    if (!selectedCollection) return toast.error("Vui lòng chọn Collection");
    if (parsedCards.length === 0) return toast.error("Không có thẻ nào để lưu");
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/flashcards/bulk-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId: selectedCollection, cards: parsedCards })
      });
      if (res.ok) {
        toast.success(`Đã lưu ${parsedCards.length} thẻ thành công!`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error("Có lỗi khi lưu");
      }
    } catch (e) {
      toast.error("Lỗi mạng");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Spreadsheet Logic ────────────────────────────────────────────────────────
  const saveHistory = useCallback((newRows: Row[]) => {
    setHistory(prev => [...prev, rows].slice(-20)); 
    setRows(newRows);
  }, [rows]);

  const updateRow = (id: string, field: keyof Row, value: string) => {
    const newRows = rows.map(r => r.id === id ? { ...r, [field]: value } : r);
    setRows(newRows);
  };

  const addRow = () => saveHistory([...rows, createEmptyRow()]);

  const duplicateRow = (index: number) => {
    const newRows = [...rows];
    newRows.splice(index + 1, 0, { ...rows[index], id: Math.random().toString(36).substring(7) });
    saveHistory(newRows);
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) return;
    saveHistory(rows.filter(r => r.id !== id));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setRows(previous);
  };

  const handleAIFill = async (id: string, term: string) => {
    if (!term.trim()) return toast.error("Vui lòng nhập từ để AI phân tích");
    const toastId = toast.loading("AI đang phân tích...");
    try {
      const res = await fetch("/api/flashcards/ai-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term })
      });
      const data = await res.json();
      if (data.success) {
        const aiData = data.result;
        const newRows = rows.map(r => r.id === id ? { 
          ...r, 
          pronunciation: aiData.pronunciation || r.pronunciation,
          meaning: aiData.meaning || r.meaning,
          part_of_speech: aiData.part_of_speech || r.part_of_speech,
          example: aiData.example || r.example,
          example_translation: aiData.example_translation || r.example_translation,
          cefr: aiData.cefr || r.cefr,
          tags: aiData.synonyms ? aiData.synonyms.join(", ") : r.tags
        } : r);
        saveHistory(newRows);
        toast.success("AI đã điền xong!", { id: toastId });
      } else {
        toast.error("AI lỗi: " + data.error, { id: toastId });
      }
    } catch (e) {
      toast.error("Lỗi mạng", { id: toastId });
    }
  };

  const handleSaveSpreadsheet = async () => {
    if (!selectedCollection) return toast.error("Vui lòng chọn Collection");
    const validRows = rows.filter(r => r.term.trim() && r.meaning.trim());
    if (validRows.length === 0) return toast.error("Không có thẻ nào hợp lệ (cần Từ và Nghĩa)");
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/flashcards/bulk-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId: selectedCollection, cards: validRows })
      });
      if (res.ok) {
        toast.success(`Đã lưu ${validRows.length} thẻ thành công!`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error("Có lỗi khi lưu");
      }
    } catch (e) {
      toast.error("Lỗi mạng");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl w-full max-w-6xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex justify-between items-center shrink-0 bg-slate-50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500" />
              Thêm từ vựng mới
            </h2>
            {/* Title only, removed tabs */}
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          
          {/* ──────────────── PASTE MODE ──────────────── */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">HƯỚNG DẪN TẠO THẺ HÀNG LOẠT BẰNG AI</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-neutral-300">
                    Sử dụng ChatGPT để tạo nhanh danh sách từ vựng theo định dạng chuẩn bên dưới, sau đó dán toàn bộ kết quả vào ô nhập liệu.
                  </p>
                  <button 
                    onClick={() => setShowPrompt(!showPrompt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors shrink-0"
                  >
                    {showPrompt ? "Ẩn Prompt" : "Hiện Prompt Mẫu"}
                    {showPrompt ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
                
                {showPrompt && (
                  <div className="mb-4 bg-[#0a0a0a] rounded-lg border border-neutral-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center p-2 border-b border-neutral-800 bg-neutral-900/50">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase px-2">Prompt Template</span>
                        <select
                          value={promptLang}
                          onChange={(e) => setPromptLang(e.target.value)}
                          className="bg-neutral-800 text-xs text-white border border-neutral-700 rounded px-2 py-1 outline-none focus:border-indigo-500"
                        >
                          <option value="tiếng Anh">Tiếng Anh</option>
                          <option value="tiếng Nhật">Tiếng Nhật</option>
                          <option value="tiếng Hàn">Tiếng Hàn</option>
                          <option value="tiếng Trung">Tiếng Trung</option>
                          <option value="tiếng Pháp">Tiếng Pháp</option>
                          <option value="tiếng Đức">Tiếng Đức</option>
                          <option value="tiếng Tây Ban Nha">Tiếng TBN</option>
                        </select>
                      </div>
                      <button 
                        onClick={copyPrompt}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                    <pre className="p-4 text-[11px] sm:text-xs text-indigo-200 font-mono whitespace-pre-wrap leading-relaxed">
                      {promptTemplate}
                    </pre>
                  </div>
                )}
                <div className="bg-[#0a0a0a] rounded-lg p-3 border border-neutral-800 font-mono text-[11px] sm:text-xs text-neutral-400">
                  <div className="text-neutral-500 mb-1"># Định dạng bắt buộc: mỗi dòng 1 từ, phân cách bằng dấu |</div>
                  <div className="text-indigo-300">Từ vựng | Phát âm | Nghĩa | Loại từ | Ví dụ | Dịch Ví dụ | Tags | CEFR | Ghi chú</div>
                </div>
              </div>

              {/* Input Area */}
              <div className="bg-slate-50 dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col">
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="abandon | /əˈbæn.dən/ | từ bỏ | verb | She abandoned her car | Cô ấy đã bỏ lại chiếc xe của mình | leave | B2 | thường dùng trong văn viết&#10;ability | /əˈbɪl.ə.ti/ | khả năng | noun | He has great ability | Anh ấy có khả năng tuyệt vời | skill | A2 | "
                  className="w-full min-h-[200px] p-5 font-mono text-sm bg-transparent border-none resize-y focus:ring-0 outline-none text-slate-700 dark:text-neutral-300 placeholder:text-slate-300 dark:placeholder:text-neutral-700"
                />
                <div className="bg-white dark:bg-neutral-900 border-t border-slate-200 dark:border-neutral-800 p-4 flex justify-between items-center">
                  <div className="text-xs font-bold text-slate-400">
                    {inputText.split('\n').filter(l => l.trim().length > 0).length} dòng
                  </div>
                  <button 
                      onClick={handleParse}
                      disabled={isProcessing || !inputText.trim()}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 dark:disabled:bg-neutral-800 disabled:text-slate-400 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                    >
                      Xem trước ({inputText.split('\n').filter(l => l.trim().length > 0).length} dòng)
                    </button>
                </div>
              </div>

              {/* Preview Section */}
              {parsedCards.length > 0 && (
                <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                  <div className="flex justify-center mb-6">
                    <ArrowDown className="w-6 h-6 text-slate-300 dark:text-neutral-700" />
                  </div>

                  <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex justify-between items-center bg-slate-50 dark:bg-neutral-900">
                      <div className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                        <FileText className="w-4 h-4" /> Bản xem trước ({parsedCards.length} thẻ)
                      </div>
                      <div className="flex items-center gap-3">
                        <select 
                          value={selectedCollection}
                          onChange={e => setSelectedCollection(e.target.value)}
                          className="px-3 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm font-semibold dark:text-white outline-none w-48 shadow-sm"
                        >
                          {collections.length === 0 && <option value="">-- Chọn Collection --</option>}
                          {collections.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <button 
                          onClick={handleSavePaste}
                          disabled={isSaving || parsedCards.length === 0 || !selectedCollection}
                          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-neutral-800 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <Save className="w-4 h-4" /> {isSaving ? "Đang lưu..." : "Lưu vào thư viện"}
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-neutral-800 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-neutral-900">
                            <th className="py-3 px-4">Từ vựng</th>
                            <th className="py-3 px-4">Phát âm</th>
                            <th className="py-3 px-4">Nghĩa</th>
                            <th className="py-3 px-4">Loại từ</th>
                            <th className="py-3 px-4">Ví dụ</th>
                            <th className="py-3 px-4">Dịch Ví dụ</th>
                            <th className="py-3 px-4">Tags</th>
                            <th className="py-3 px-4">CEFR</th>
                            <th className="py-3 px-4">Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-neutral-900">
                          {parsedCards.map((card, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-neutral-900/50 transition-colors text-sm">
                              <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">{card.term}</td>
                              <td className="py-3 px-4 text-slate-500 font-mono text-xs">{card.pronunciation}</td>
                              <td className="py-3 px-4 text-slate-700 dark:text-neutral-300 font-medium">{card.meaning}</td>
                              <td className="py-3 px-4 text-indigo-600 dark:text-indigo-400 italic text-xs font-medium">{card.part_of_speech}</td>
                              <td className="py-3 px-4 text-slate-500 dark:text-neutral-400 italic">"{card.example}"</td>
                              <td className="py-3 px-4 text-slate-500 dark:text-neutral-400 italic">{card.example_translation ? `"${card.example_translation}"` : ""}</td>
                              <td className="py-3 px-4 text-slate-500">{card.tags}</td>
                              <td className="py-3 px-4 text-slate-500 font-bold">{card.cefr}</td>
                              <td className="py-3 px-4 text-slate-500">{card.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
