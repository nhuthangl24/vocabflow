"use client";

import { useState } from "react";

export default function VideoWorkspaceClient({ videoUrl, vocabulary, userId }: { videoUrl: string, vocabulary: any[], userId: string }) {
  const [selectedVocab, setSelectedVocab] = useState<any | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>("all"); // 'all', 'A', 'B', 'C'

  const filteredVocabulary = vocabulary.filter(v => {
    if (levelFilter === "all") return true;
    if (levelFilter === "A") return v.level?.startsWith("A");
    if (levelFilter === "B") return v.level?.startsWith("B");
    if (levelFilter === "C") return v.level?.startsWith("C");
    return true;
  });

  return (
    <div className="w-full">
      
      {/* Vocabulary Grid */}
      <div className="w-full bg-white rounded-lg shadow border border-gray-200 transition-all duration-300">
        <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="font-semibold text-gray-900 text-lg">Danh sách từ vựng ({filteredVocabulary.length})</h2>
          
          <div className="flex bg-white rounded-lg border border-gray-300 p-1 overflow-x-auto max-w-full">
            <button 
              onClick={() => setLevelFilter('all')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap ${levelFilter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Tất cả
            </button>
            <button 
              onClick={() => setLevelFilter('A')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap ${levelFilter === 'A' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Cơ bản (A)
            </button>
            <button 
              onClick={() => setLevelFilter('B')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap ${levelFilter === 'B' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Trung cấp (B)
            </button>
            <button 
              onClick={() => setLevelFilter('C')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap ${levelFilter === 'C' ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Cao cấp (C)
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-8">
          {/* Section: Single Words */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Từ đơn (Single Words)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVocabulary.filter(v => !v.term.trim().includes(' ')).map((vocab, index) => (
                <div key={vocab.id} className="relative" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
                  {/* The Static Background Card */}
                  <div 
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 h-full flex flex-col justify-between ${selectedVocab?.id === vocab.id ? 'opacity-0' : 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white'}`}
                    onClick={() => setSelectedVocab(vocab)}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-900 capitalize">{vocab.term}</h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${vocab.level?.startsWith('A') ? 'bg-green-100 text-green-800' : vocab.level?.startsWith('B') ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{vocab.level}</span>
                      </div>
                      <p className="text-gray-600 line-clamp-2 first-letter:uppercase">{vocab.meaning_vi}</p>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{vocab.part_of_speech}</span>
                      <span className="text-blue-500 font-bold text-xs uppercase tracking-widest bg-blue-50 px-2 py-1 rounded hover:bg-blue-100">Chạm để xem</span>
                    </div>
                  </div>

                  {/* The Floating Popover */}
                  {selectedVocab?.id === vocab.id && (
                    <>
                      {/* Invisible backdrop to detect clicks outside if needed, optional, but useful */}
                      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setSelectedVocab(null); }}></div>
                      
                      <div className="absolute top-[-12px] left-[-12px] right-[-12px] z-50 bg-white p-5 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-gray-200 animate-in zoom-in-95 fade-in duration-200">
                        <div className="flex justify-between items-start mb-2">
                          <h2 className="text-2xl font-bold text-blue-700 capitalize">
                            {vocab.term} <span className="text-gray-500 text-base font-normal ml-2 normal-case">{vocab.pronunciation}</span>
                          </h2>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedVocab(null); }}
                            className="text-gray-400 hover:text-gray-900 p-1.5 rounded-md hover:bg-gray-100 bg-gray-50"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="text-sm font-medium text-blue-600 mb-4">{vocab.part_of_speech} • {vocab.level}</div>
                        
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider border-b pb-1 mb-2">Ý nghĩa</h3>
                            <p className="text-gray-900 font-medium text-lg first-letter:uppercase">{vocab.meaning_vi}</p>
                            <p className="text-sm text-gray-500 italic mt-1">Ngữ cảnh: {vocab.context_meaning_vi}</p>
                          </div>

                          {vocab.usage_note_vi && (
                            <div>
                              <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider border-b pb-1 mb-2">Cách dùng</h3>
                              <p className="text-gray-700 leading-relaxed">{vocab.usage_note_vi}</p>
                            </div>
                          )}

                          <div>
                            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider border-b pb-1 mb-2">Ví dụ</h3>
                            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-2">
                              <p className="font-medium text-gray-900">"{vocab.original_sentence}"</p>
                              <p className="text-gray-600 italic mt-1 text-sm">{vocab.sentence_translation_vi}</p>
                            </div>
                            {vocab.examples && vocab.examples.map((ex: any, i: number) => (
                              <div key={i} className="pl-1 mt-2">
                                <p className="text-gray-800 text-sm">{ex.sentence}</p>
                                <p className="text-gray-500 italic text-xs mt-0.5">{ex.translationVi}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {filteredVocabulary.filter(v => !v.term.trim().includes(' ')).length === 0 && (
                <div className="text-gray-500 italic">Không có từ đơn nào ở cấp độ này.</div>
              )}
            </div>
          </div>

          {/* Section: Phrases & Idioms */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Cụm từ & Thành ngữ (Phrases / Idioms)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVocabulary.filter(v => v.term.trim().includes(' ')).map((vocab, index) => (
                <div key={vocab.id} className="relative" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
                  {/* The Static Background Card */}
                  <div 
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 h-full flex flex-col justify-between ${selectedVocab?.id === vocab.id ? 'opacity-0' : 'border-gray-200 hover:border-purple-300 hover:shadow-md bg-white'}`}
                    onClick={() => setSelectedVocab(vocab)}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-900 capitalize">{vocab.term}</h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${vocab.level?.startsWith('A') ? 'bg-green-100 text-green-800' : vocab.level?.startsWith('B') ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{vocab.level}</span>
                      </div>
                      <p className="text-gray-600 line-clamp-2 first-letter:uppercase">{vocab.meaning_vi}</p>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{vocab.part_of_speech}</span>
                      <span className="text-purple-500 font-bold text-xs uppercase tracking-widest bg-purple-50 px-2 py-1 rounded hover:bg-purple-100">Chạm để xem</span>
                    </div>
                  </div>

                  {/* The Floating Popover */}
                  {selectedVocab?.id === vocab.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setSelectedVocab(null); }}></div>
                      
                      <div className="absolute top-[-12px] left-[-12px] right-[-12px] z-50 bg-white p-5 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-gray-200 animate-in zoom-in-95 fade-in duration-200">
                        <div className="flex justify-between items-start mb-2">
                          <h2 className="text-2xl font-bold text-purple-700 capitalize">
                            {vocab.term} <span className="text-gray-500 text-base font-normal ml-2 normal-case">{vocab.pronunciation}</span>
                          </h2>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedVocab(null); }}
                            className="text-gray-400 hover:text-gray-900 p-1.5 rounded-md hover:bg-gray-100 bg-gray-50"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="text-sm font-medium text-purple-600 mb-4">{vocab.part_of_speech} • {vocab.level}</div>
                        
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider border-b pb-1 mb-2">Ý nghĩa</h3>
                            <p className="text-gray-900 font-medium text-lg first-letter:uppercase">{vocab.meaning_vi}</p>
                            <p className="text-sm text-gray-500 italic mt-1">Ngữ cảnh: {vocab.context_meaning_vi}</p>
                          </div>

                          {vocab.usage_note_vi && (
                            <div>
                              <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider border-b pb-1 mb-2">Cách dùng</h3>
                              <p className="text-gray-700 leading-relaxed">{vocab.usage_note_vi}</p>
                            </div>
                          )}

                          <div>
                            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider border-b pb-1 mb-2">Ví dụ</h3>
                            <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100 mb-2">
                              <p className="font-medium text-gray-900">"{vocab.original_sentence}"</p>
                              <p className="text-gray-600 italic mt-1 text-sm">{vocab.sentence_translation_vi}</p>
                            </div>
                            {vocab.examples && vocab.examples.map((ex: any, i: number) => (
                              <div key={i} className="pl-1 mt-2">
                                <p className="text-gray-800 text-sm">{ex.sentence}</p>
                                <p className="text-gray-500 italic text-xs mt-0.5">{ex.translationVi}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {filteredVocabulary.filter(v => v.term.trim().includes(' ')).length === 0 && (
                <div className="text-gray-500 italic">Không có cụm từ nào ở cấp độ này.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
