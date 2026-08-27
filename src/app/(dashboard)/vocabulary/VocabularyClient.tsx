"use client";

import { useState } from "react";
import { Search, Volume2, Bookmark, X, ExternalLink } from "lucide-react";

type VocabularyItem = {
  id: string;
  term: string;
  pronunciation?: string;
  part_of_speech?: string;
  meaning_vi: string;
  context_meaning_vi?: string;
  level?: string;
  original_sentence?: string;
  sentence_translation_vi?: string;
  usage_note_vi?: string;
  examples?: any;
  collocations?: string[];
  synonyms?: string[];
  antonyms?: string[];
  word_family?: string[];
};

export default function VocabularyClient({ items }: { items: VocabularyItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("All");
  const [selectedItem, setSelectedItem] = useState<VocabularyItem | null>(null);

  // Deduplicate items based on term (case insensitive)
  const deduplicatedItems = items.reduce((acc: VocabularyItem[], current) => {
    const x = acc.find(item => item.term.toLowerCase() === current.term.toLowerCase());
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

  const filteredItems = deduplicatedItems.filter((item) => {
    const matchesSearch = item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.meaning_vi.toLowerCase().includes(searchQuery.toLowerCase());
    const itemLang = (item as any).transcript_jobs?.settings?.targetLanguage || "English";
    const matchesLang = targetLanguage === "All" || itemLang === targetLanguage;
    return matchesSearch && matchesLang;
  });

  const playAudio = (e: React.MouseEvent, text: string, langName: string) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;
    
    // Map lang string to browser locales
    let langCode = 'en-US';
    if (langName === 'Chinese') langCode = 'zh-CN';
    else if (langName === 'Japanese') langCode = 'ja-JP';
    else if (langName === 'Korean') langCode = 'ko-KR';

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const getDictionaryLinks = (term: string, langName: string) => {
    const l = (langName || "").toLowerCase();
    if (l.includes("chinese") || l.includes("trung")) {
      return [
        { name: "Yabla", url: `https://chinese.yabla.com/chinese-english-pinyin-dictionary.php?define=${encodeURIComponent(term)}` },
        { name: "YellowBridge", url: `https://www.yellowbridge.com/chinese/dictionary.php?word=${encodeURIComponent(term)}` }
      ];
    } else if (l.includes("japanese") || l.includes("nhật")) {
      return [
        { name: "Jisho", url: `https://jisho.org/search/${encodeURIComponent(term)}` },
        { name: "Tangorin", url: `https://tangorin.com/words?search=${encodeURIComponent(term)}` }
      ];
    } else if (l.includes("korean") || l.includes("hàn")) {
      return [
        { name: "Naver", url: `https://dict.naver.com/search.dict?dicQuery=${encodeURIComponent(term)}` },
        { name: "Daum", url: `https://dic.daum.net/search.do?q=${encodeURIComponent(term)}` }
      ];
    } else if (l.includes("french") || l.includes("pháp")) {
      return [
        { name: "Collins", url: `https://www.collinsdictionary.com/dictionary/french-english/${encodeURIComponent(term)}` },
        { name: "WordReference", url: `https://www.wordreference.com/fren/${encodeURIComponent(term)}` }
      ];
    }
    return [
      { name: "Cambridge", url: `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(term)}` },
      { name: "Oxford", url: `https://www.oxfordlearnersdictionaries.com/definition/english/${encodeURIComponent(term)}` }
    ];
  };

  const getLevelColor = (level: string) => {
    if (!level) return "bg-slate-100 text-slate-800 dark:bg-neutral-800 dark:text-neutral-300";
    const l = level.toUpperCase();
    if (l.startsWith("A") || l.includes("HSK 1") || l.includes("HSK 2") || l.includes("N5") || l.includes("N4") || l.includes("LEVEL 1") || l.includes("LEVEL 2")) {
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50";
    }
    if (l.startsWith("B") || l.includes("HSK 3") || l.includes("HSK 4") || l.includes("N3") || l.includes("LEVEL 3") || l.includes("LEVEL 4")) {
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50";
    }
    return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50";
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] rounded-xl border border-slate-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="h-14 border-b border-slate-100 dark:border-neutral-800 flex items-center px-4 shrink-0 bg-slate-50/50 dark:bg-neutral-900 dark:bg-[#0a0a0a]/50">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 dark:text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm kiếm từ vựng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-4 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
          />
        </div>
        
        <select
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
          className="ml-3 h-9 px-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm font-medium text-slate-700 dark:text-neutral-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm shrink-0 dark:text-neutral-200"
        >
          <option value="All">Tất cả tiếng</option>
          <option value="English">Tiếng Anh</option>
          <option value="Chinese">Tiếng Trung</option>
          <option value="Japanese">Tiếng Nhật</option>
          <option value="Korean">Tiếng Hàn</option>
        </select>

        <div className="ml-auto text-sm font-medium text-slate-500 dark:text-neutral-400">
          Tổng cộng: {filteredItems.length} từ
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30 dark:bg-neutral-950/30">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 text-slate-500 dark:text-neutral-400">
            Không tìm thấy từ vựng nào.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all relative group flex flex-col cursor-pointer"
              >
                <button className="absolute top-3 right-3 text-slate-300 dark:text-slate-600 hover:text-amber-400 dark:hover:text-amber-400 transition-colors">
                  <Bookmark className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1 pr-6">{item.term}</h3>
                
                <div className="flex items-center gap-2 mb-3 text-xs font-medium text-slate-500 dark:text-neutral-400">
                  {item.part_of_speech && (
                    <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-neutral-300 uppercase text-[10px] tracking-wider dark:bg-neutral-900">
                      {item.part_of_speech}
                    </span>
                  )}
                  {item.pronunciation && (
                    <button 
                      onClick={(e) => playAudio(e, item.term, (item as any).transcript_jobs?.settings?.targetLanguage || "English")}
                      className="flex items-center gap-1 text-slate-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-white font-sans transition-colors p-1 -ml-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-3 h-3" />
                      /{item.pronunciation}/
                    </button>
                  )}
                </div>
                
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex-1 mb-2">
                  {item.meaning_vi}
                </p>
                
                {item.level && (
                  <div className="mt-auto">
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getLevelColor(item.level)}`}>
                        {item.level}
                     </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 dark:bg-[#0a0a0a]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-slate-50/50 dark:bg-neutral-900 dark:border-neutral-800">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{selectedItem.term}</h2>
                  <button 
                    onClick={(e) => playAudio(e, selectedItem.term, (selectedItem as any).transcript_jobs?.settings?.targetLanguage || "English")}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700 transition-colors shadow-sm mt-1"
                    title="Phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium">
                  {selectedItem.part_of_speech && (
                    <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-indigo-600 uppercase tracking-wider text-xs shadow-sm dark:bg-[#0a0a0a] dark:border-neutral-700">
                      {selectedItem.part_of_speech}
                    </span>
                  )}
                  {selectedItem.pronunciation && (
                    <span className="flex items-center gap-1.5 text-slate-500 font-sans dark:text-neutral-400">
                      /{selectedItem.pronunciation}/
                    </span>
                  )}
                  {selectedItem.level && (
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getLevelColor(selectedItem.level)}`}>
                      {selectedItem.level}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex items-center gap-1 mr-2">
                  {getDictionaryLinks(selectedItem.term, (selectedItem as any).transcript_jobs?.settings?.targetLanguage || "English").map((dict, i) => (
                    <a 
                      key={i}
                      href={dict.url}
                      target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-neutral-700"
                    >
                      {dict.name} <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors shrink-0 dark:text-white dark:text-neutral-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 dark:text-neutral-400">Định nghĩa</h3>
                <p className="text-xl font-medium text-neutral-800 dark:text-neutral-100">{selectedItem.meaning_vi}</p>
                {selectedItem.context_meaning_vi && (
                  <p className="text-sm text-slate-600 mt-2 bg-slate-50 dark:bg-neutral-800 p-3 rounded-lg border border-slate-200 dark:border-neutral-700 dark:text-neutral-300">
                    <span className="font-semibold text-slate-700 dark:text-white">Ngữ cảnh trong video:</span> {selectedItem.context_meaning_vi}
                  </p>
                )}
              </div>

              {selectedItem.original_sentence && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 dark:text-neutral-400">Câu gốc trong video</h3>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 dark:bg-[#0a0a0a] dark:border-neutral-800">
                    <p className="text-base text-neutral-800 dark:text-neutral-100 font-medium italic mb-2">"{selectedItem.original_sentence}"</p>
                    {selectedItem.sentence_translation_vi && (
                      <p className="text-sm text-slate-600 dark:text-neutral-300">Dịch: {selectedItem.sentence_translation_vi}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedItem.usage_note_vi && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 dark:text-neutral-400">Lưu ý cách dùng</h3>
                  <p className="text-sm text-slate-700 leading-relaxed dark:text-neutral-200">{selectedItem.usage_note_vi}</p>
                </div>
              )}
              
              {(selectedItem.synonyms?.length > 0 || selectedItem.antonyms?.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                  {selectedItem.synonyms?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 dark:text-neutral-400">Đồng nghĩa</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.synonyms.map(syn => (
                          <span key={syn} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200/60 dark:text-neutral-200 dark:bg-neutral-900">{syn}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedItem.antonyms?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 dark:text-neutral-400">Trái nghĩa</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.antonyms.map(ant => (
                          <span key={ant} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200/60 dark:text-neutral-200 dark:bg-neutral-900">{ant}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
