"use client";

import { useState, useRef, useEffect } from "react";
import { Volume2, ExternalLink } from "lucide-react";

export default function VideoWorkspaceClient({ videoUrl, vocabulary, grammar = [], userId, targetLanguage = "English" }: { videoUrl: string, vocabulary: any[], grammar?: any[], userId: string, targetLanguage?: string }) {
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // Suppress the annoying ReactPlayer AbortError in Next.js Dev Mode
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('The play() request was interrupted')) return;
      if (args[0] && args[0].name === 'AbortError') return;
      originalError(...args);
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && (event.reason.name === 'AbortError' || (event.reason.message && event.reason.message.includes('play()')))) {
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      console.error = originalError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  const [activeTab, setActiveTab] = useState<"vocab" | "grammar">("vocab");
  const [selectedVocab, setSelectedVocab] = useState<any | null>(null);
  const [selectedGrammar, setSelectedGrammar] = useState<any | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>("all"); // 'all', 'A', 'B', 'C'

  const getDictionaryLinks = (term: string, langName: string) => {
    const l = langName.toLowerCase();
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

  const playAudio = (e: React.MouseEvent, text: string, langName: string) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;
    let langCode = 'en-US';
    if (langName === 'Chinese') langCode = 'zh-CN';
    else if (langName === 'Japanese') langCode = 'ja-JP';
    else if (langName === 'Korean') langCode = 'ko-KR';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };


  const filteredVocabulary = vocabulary.filter(v => {
    if (levelFilter === "all") return true;
    if (levelFilter === "A") return v.level?.startsWith("A");
    if (levelFilter === "B") return v.level?.startsWith("B");
    if (levelFilter === "C") return v.level?.startsWith("C");
    return true;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">

      <div className="w-full">
        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200 dark:border-neutral-700 mb-6 dark:border-neutral-700">
        <button
          onClick={() => setActiveTab("vocab")}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === "vocab" ? "border-blue-600 text-blue-600 dark:border-white dark:text-white" : "border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:text-neutral-200 hover:border-gray-300"} dark:text-neutral-400`}
        >
          Từ vựng ({vocabulary.length})
        </button>
        <button
          onClick={() => setActiveTab("grammar")}
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === "grammar" ? "border-purple-600 text-purple-600 dark:border-white dark:text-white" : "border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:text-neutral-200 hover:border-gray-300"} dark:text-neutral-400`}
        >
          Ngữ pháp ({grammar.length})
        </button>
      </div>

      {activeTab === "vocab" && (
        <div className="w-full bg-white dark:bg-[#0a0a0a] rounded-lg shadow border border-gray-200 dark:border-neutral-700 transition-all duration-300 dark:bg-[#0a0a0a] dark:border-neutral-700">
          <div className="p-4 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 rounded-t-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 dark:bg-[#0a0a0a] dark:border-neutral-700">
            <h2 className="font-semibold text-gray-900 dark:text-white text-lg">Danh sách từ vựng ({filteredVocabulary.length})</h2>
            
            <div className="flex bg-white dark:bg-[#0a0a0a] rounded-lg border border-gray-300 p-1 overflow-x-auto max-w-full dark:bg-[#0a0a0a] dark:border-neutral-600">
              <button 
                onClick={() => setLevelFilter('all')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap ${levelFilter === 'all' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-600 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}
              >
                Tất cả
              </button>
              <button 
                onClick={() => setLevelFilter('A')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap ${levelFilter === 'A' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'text-gray-600 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}
              >
                Cơ bản (A)
              </button>
              <button 
                onClick={() => setLevelFilter('B')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap ${levelFilter === 'B' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' : 'text-gray-600 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}
              >
                Trung cấp (B)
              </button>
              <button 
                onClick={() => setLevelFilter('C')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap ${levelFilter === 'C' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'text-gray-600 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}
              >
                Cao cấp (C)
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-8">
            {/* Section: Single Words */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-neutral-100 mb-4 border-b pb-2 dark:text-neutral-100">Từ đơn (Single Words)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVocabulary.filter(v => !v.term.trim().includes(' ')).map((vocab, index) => (
                  <div key={vocab.id} className="relative" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
                    {/* The Static Background Card */}
                    <div 
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 h-full flex flex-col justify-between ${selectedVocab?.id === vocab.id ? 'opacity-0' : 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white dark:bg-[#0a0a0a]'} dark:bg-[#0a0a0a]`}
                      onClick={() => setSelectedVocab(vocab)}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white capitalize">{vocab.term}</h3>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${getLevelColor(vocab.level)}`}>{vocab.level}</span>
                        </div>
                        <p className="text-gray-600 dark:text-neutral-300 line-clamp-2 first-letter:uppercase dark:text-neutral-300">{vocab.meaning_vi}</p>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider dark:text-neutral-400">{vocab.part_of_speech}</span>
                        <span className="text-blue-600 font-bold text-xs uppercase tracking-widest bg-blue-50 dark:bg-neutral-800 px-2 py-1 rounded hover:bg-blue-100 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700">Chạm để xem</span>
                      </div>
                    </div>

                    {/* The Floating Popover (Fixed Modal) */}
                    {selectedVocab?.id === vocab.id && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity" onClick={(e) => { e.stopPropagation(); setSelectedVocab(null); }}></div>
                        
                        <div className="relative bg-white dark:bg-[#0a0a0a] p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200 dark:bg-[#0a0a0a] dark:border-neutral-700">
                          
                          <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100 dark:border-neutral-800">
                            <div>
                              <div className="flex items-center gap-3">
                                <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-white capitalize leading-tight">
                                  {vocab.term}
                                </h2>
                                <button 
                                  onClick={(e) => playAudio(e, vocab.term, targetLanguage)}
                                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700 transition-colors shadow-sm mt-1"
                                  title="Phát âm"
                                >
                                  <Volume2 className="w-4 h-4" />
                                </button>
                              </div>
                              <span className="text-gray-500 dark:text-neutral-400 text-base font-normal mt-1 block normal-case dark:text-neutral-400">{vocab.pronunciation}</span>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <div className="flex items-center gap-1 mr-2 hidden sm:flex">
                                {getDictionaryLinks(vocab.term, targetLanguage).map((dict, i) => (
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
                                onClick={(e) => { e.stopPropagation(); setSelectedVocab(null); }}
                                className="text-gray-400 hover:text-gray-900 dark:text-white p-2 rounded-full hover:bg-gray-100 bg-gray-50 transition-colors shrink-0 dark:text-neutral-400 dark:bg-neutral-900"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          </div>
  
                          <div className="inline-flex items-center gap-2 mb-6 bg-blue-50 dark:bg-neutral-800 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-neutral-700">
                            <span className="text-sm font-semibold text-blue-700 dark:text-white uppercase tracking-wider">{vocab.part_of_speech}</span>
                            <span className="text-blue-300">•</span>
                            <span className="text-sm font-bold text-blue-700 dark:text-white">{vocab.level}</span>
                          </div>
                          
                          <div className="space-y-6">
                            <div>
                              <h3 className="font-semibold text-gray-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-2 dark:text-neutral-400">Ý nghĩa</h3>
                              <p className="text-gray-900 dark:text-white font-medium text-lg first-letter:uppercase">{vocab.meaning_vi}</p>
                              <p className="text-sm text-gray-500 dark:text-neutral-400 italic mt-1 bg-gray-50 p-2 rounded border border-gray-100 dark:text-neutral-400 dark:bg-[#0a0a0a] dark:border-neutral-800">Ngữ cảnh: {vocab.context_meaning_vi}</p>
                            </div>

                            {vocab.usage_note_vi && (
                              <div>
                                <h3 className="font-semibold text-gray-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-2 dark:text-neutral-400">Cách dùng</h3>
                                <p className="text-gray-700 dark:text-neutral-200 leading-relaxed dark:text-neutral-200">{vocab.usage_note_vi}</p>
                              </div>
                            )}

                            <div>
                              <h3 className="font-semibold text-gray-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-3 dark:text-neutral-400">Ví dụ</h3>
                              <div className="bg-blue-50/70 dark:bg-neutral-900 p-4 rounded-xl border border-blue-100 dark:border-neutral-700 mb-3 shadow-sm">
                                <p className="font-medium text-gray-900 dark:text-white text-[15px] leading-relaxed">"{vocab.original_sentence}"</p>
                                <p className="text-gray-600 dark:text-neutral-300 italic mt-2 text-sm dark:text-neutral-300">{vocab.sentence_translation_vi}</p>
                              </div>
                              {vocab.examples && vocab.examples.map((ex: any, i: number) => (
                                <div key={i} className="pl-3 mt-3 border-l-2 border-blue-200">
                                  <p className="text-gray-800 dark:text-neutral-100 text-sm font-medium dark:text-neutral-100">{ex.sentence}</p>
                                  <p className="text-gray-500 dark:text-neutral-400 italic text-sm mt-1 dark:text-neutral-400">{ex.translationVi}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {filteredVocabulary.filter(v => !v.term.trim().includes(' ')).length === 0 && (
                  <div className="text-gray-500 dark:text-neutral-400 italic dark:text-neutral-400">Không có từ đơn nào ở cấp độ này.</div>
                )}
              </div>
            </div>

            {/* Section: Phrases & Idioms */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-neutral-100 mb-4 border-b pb-2 dark:text-neutral-100">Cụm từ & Thành ngữ (Phrases / Idioms)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVocabulary.filter(v => v.term.trim().includes(' ')).map((vocab, index) => (
                  <div key={vocab.id} className="relative" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
                    {/* The Static Background Card */}
                    <div 
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 h-full flex flex-col justify-between ${selectedVocab?.id === vocab.id ? 'opacity-0' : 'border-gray-200 hover:border-purple-300 dark:border-neutral-600 hover:shadow-md bg-white dark:bg-[#0a0a0a]'} dark:bg-[#0a0a0a]`}
                      onClick={() => setSelectedVocab(vocab)}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white capitalize">{vocab.term}</h3>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${getLevelColor(vocab.level)}`}>{vocab.level}</span>
                        </div>
                        <p className="text-gray-600 dark:text-neutral-300 line-clamp-2 first-letter:uppercase dark:text-neutral-300">{vocab.meaning_vi}</p>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider dark:text-neutral-400">{vocab.part_of_speech}</span>
                        <span className="text-purple-600 font-bold text-xs uppercase tracking-widest bg-purple-50 dark:bg-neutral-800 px-2 py-1 rounded hover:bg-purple-100 dark:bg-neutral-800 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700">Chạm để xem</span>
                      </div>
                    </div>

                    {/* The Floating Popover (Fixed Modal) */}
                    {selectedVocab?.id === vocab.id && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity" onClick={(e) => { e.stopPropagation(); setSelectedVocab(null); }}></div>
                        
                        <div className="relative bg-white dark:bg-[#0a0a0a] p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200 dark:bg-[#0a0a0a] dark:border-neutral-700">
                          
                          <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100 dark:border-neutral-800">
                            <div>
                              <div className="flex items-center gap-3">
                                <h2 className="text-2xl sm:text-3xl font-bold text-purple-700 dark:text-white capitalize leading-tight">
                                  {vocab.term}
                                </h2>
                                <button 
                                  onClick={(e) => playAudio(e, vocab.term, targetLanguage)}
                                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700 transition-colors shadow-sm mt-1"
                                  title="Phát âm"
                                >
                                  <Volume2 className="w-4 h-4" />
                                </button>
                              </div>
                              <span className="text-gray-500 dark:text-neutral-400 text-base font-normal mt-1 block normal-case dark:text-neutral-400">{vocab.pronunciation}</span>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <div className="flex items-center gap-1 mr-2 hidden sm:flex">
                                {getDictionaryLinks(vocab.term, targetLanguage).map((dict, i) => (
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
                                onClick={(e) => { e.stopPropagation(); setSelectedVocab(null); }}
                                className="text-gray-400 hover:text-gray-900 dark:text-white p-2 rounded-full hover:bg-gray-100 bg-gray-50 transition-colors shrink-0 dark:text-neutral-400 dark:bg-neutral-900"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          </div>
  
                          <div className="inline-flex items-center gap-2 mb-6 bg-purple-50 dark:bg-neutral-800 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-neutral-700">
                            <span className="text-sm font-semibold text-purple-700 dark:text-white uppercase tracking-wider">{vocab.part_of_speech}</span>
                            <span className="text-purple-300">•</span>
                            <span className="text-sm font-bold text-purple-700 dark:text-white">{vocab.level}</span>
                          </div>
                          
                          <div className="space-y-6">
                            <div>
                              <h3 className="font-semibold text-gray-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-2 dark:text-neutral-400">Ý nghĩa</h3>
                              <p className="text-gray-900 dark:text-white font-medium text-lg first-letter:uppercase">{vocab.meaning_vi}</p>
                              <p className="text-sm text-gray-500 dark:text-neutral-400 italic mt-1 bg-gray-50 p-2 rounded border border-gray-100 dark:text-neutral-400 dark:bg-[#0a0a0a] dark:border-neutral-800">Ngữ cảnh: {vocab.context_meaning_vi}</p>
                            </div>

                            {vocab.usage_note_vi && (
                              <div>
                                <h3 className="font-semibold text-gray-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-2 dark:text-neutral-400">Cách dùng</h3>
                                <p className="text-gray-700 dark:text-neutral-200 leading-relaxed dark:text-neutral-200">{vocab.usage_note_vi}</p>
                              </div>
                            )}

                            <div>
                              <h3 className="font-semibold text-gray-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-3 dark:text-neutral-400">Ví dụ</h3>
                              <div className="bg-purple-50/70 dark:bg-neutral-900 p-4 rounded-xl border border-purple-100 dark:border-neutral-700 mb-3 shadow-sm">
                                <p className="font-medium text-gray-900 dark:text-white text-[15px] leading-relaxed">"{vocab.original_sentence}"</p>
                                <p className="text-gray-600 dark:text-neutral-300 italic mt-2 text-sm dark:text-neutral-300">{vocab.sentence_translation_vi}</p>
                              </div>
                              {vocab.examples && vocab.examples.map((ex: any, i: number) => (
                                <div key={i} className="pl-3 mt-3 border-l-2 border-purple-200 dark:border-neutral-700">
                                  <p className="text-gray-800 dark:text-neutral-100 text-sm font-medium dark:text-neutral-100">{ex.sentence}</p>
                                  <p className="text-gray-500 dark:text-neutral-400 italic text-sm mt-1 dark:text-neutral-400">{ex.translationVi}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {filteredVocabulary.filter(v => v.term.trim().includes(' ')).length === 0 && (
                  <div className="text-gray-500 dark:text-neutral-400 italic dark:text-neutral-400">Không có cụm từ nào ở cấp độ này.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "grammar" && (
        <div className="w-full bg-white dark:bg-[#0a0a0a] rounded-lg shadow border border-gray-200 dark:border-neutral-700 transition-all duration-300 dark:bg-[#0a0a0a] dark:border-neutral-700">
          <div className="p-4 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 rounded-t-lg dark:bg-[#0a0a0a] dark:border-neutral-700">
            <h2 className="font-semibold text-gray-900 dark:text-white text-lg">Cấu trúc ngữ pháp ({grammar.length})</h2>
          </div>
          
          <div className="p-4 space-y-6">
            {grammar.length === 0 ? (
              <div className="text-gray-500 dark:text-neutral-400 italic p-4 text-center dark:text-neutral-400">Video này chưa có cấu trúc ngữ pháp nào được trích xuất.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {grammar.map((item, index) => (
                  <div key={item.id} className="relative" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
                    <div 
                      className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 h-full flex flex-col justify-between ${selectedGrammar?.id === item.id ? 'opacity-0' : 'border-gray-200 hover:border-purple-400 hover:shadow-lg bg-white dark:bg-[#0a0a0a]'} dark:bg-[#0a0a0a]`}
                      onClick={() => setSelectedGrammar(item)}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-lg text-purple-800 dark:text-white capitalize leading-tight pr-4">{item.grammar_pattern}</h3>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-neutral-800 text-purple-800 dark:text-white shrink-0">{item.level || "N/A"}</span>
                        </div>
                        <p className="text-gray-700 dark:text-neutral-200 font-medium line-clamp-2 first-letter:uppercase mb-3 dark:text-neutral-200">{item.meaning_vi}</p>
                      </div>
                      <div className="mt-4 flex justify-between items-center border-t border-gray-100 pt-3 dark:border-neutral-800">
                        <span className="text-xs text-gray-500 dark:text-neutral-400 font-medium dark:text-neutral-400">Click để xem giải thích</span>
                        <span className="text-purple-600 font-bold text-xs uppercase tracking-widest bg-purple-50 dark:bg-neutral-800 px-2.5 py-1 rounded hover:bg-purple-100 dark:bg-neutral-800 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700">Chi tiết</span>
                      </div>
                    </div>

                    {/* Popover for Grammar (Fixed Modal) */}
                    {selectedGrammar?.id === item.id && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity" onClick={(e) => { e.stopPropagation(); setSelectedGrammar(null); }}></div>
                        
                        <div className="relative bg-white dark:bg-[#0a0a0a] p-6 sm:p-8 rounded-2xl shadow-2xl border border-purple-200 dark:border-neutral-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200 dark:bg-[#0a0a0a]">
                          <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4 dark:border-neutral-800">
                            <div className="pr-4">
                              <h2 className="text-2xl sm:text-3xl font-bold text-purple-800 dark:text-white capitalize leading-tight">
                                {item.grammar_pattern}
                              </h2>
                              <div className="text-sm font-semibold text-purple-700 dark:text-white mt-2 bg-purple-50 dark:bg-neutral-800 inline-block px-3 py-1 rounded-lg border border-purple-100 dark:border-neutral-700">Cấp độ {item.level || "N/A"}</div>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedGrammar(null); }}
                              className="text-gray-400 hover:text-gray-900 dark:text-white p-2 rounded-full hover:bg-gray-100 bg-gray-50 shrink-0 transition-colors dark:text-neutral-400 dark:bg-[#0a0a0a]"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                          
                          <div className="space-y-6">
                            <div>
                              <h3 className="font-bold text-gray-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-2 dark:text-neutral-400">Ý nghĩa</h3>
                              <p className="text-gray-900 dark:text-white font-medium text-lg first-letter:uppercase">{item.meaning_vi}</p>
                            </div>

                            {item.explanation_vi && (
                              <div>
                                <h3 className="font-bold text-gray-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-2 dark:text-neutral-400">Cách dùng (Giải thích)</h3>
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 dark:border-neutral-700 dark:bg-[#0a0a0a] dark:border-neutral-700">
                                  <p className="text-gray-800 dark:text-neutral-100 leading-relaxed whitespace-pre-line dark:text-neutral-100">{item.explanation_vi}</p>
                                </div>
                              </div>
                            )}

                            <div>
                              <h3 className="font-bold text-gray-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-3 dark:text-neutral-400">Ví dụ trong Video</h3>
                              <div className="bg-purple-50 dark:bg-neutral-800 p-5 rounded-xl border border-purple-200 dark:border-neutral-700 mb-5 shadow-sm">
                                <p className="font-medium text-purple-900 dark:text-white text-[15px] leading-relaxed">"{item.original_sentence}"</p>
                                <p className="text-purple-700 dark:text-neutral-300 italic mt-2 text-sm">{item.sentence_translation_vi}</p>
                                <button 
                                  className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors shrink-0 text-slate-500 dark:text-neutral-400"
                                  onClick={(e) => playAudio(e, item.original_sentence, targetLanguage)}
                                  title="Nghe phát âm"
                                >
                                  <Volume2 className="w-4 h-4" />
                                </button>
                              </div>
                              
                              {item.examples && item.examples.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-gray-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-3 dark:text-neutral-400">Ví dụ bổ sung</h4>
                                  <div className="space-y-4">
                                    {item.examples.map((ex: any, i: number) => (
                                      <div key={i} className="pl-4 border-l-2 border-purple-300 dark:border-neutral-600">
                                        <p className="text-gray-800 dark:text-neutral-100 font-medium text-[15px] dark:text-neutral-100">{ex.sentence}</p>
                                        <p className="text-gray-500 dark:text-neutral-400 italic text-sm mt-1 dark:text-neutral-400">{ex.translationVi}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// force rebuild 26
