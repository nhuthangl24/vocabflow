const fs = require('fs');

let lines = fs.readFileSync('src/components/video/VideoWorkspaceClient.tsx', 'utf8').split('\n');

const removeRanges = [
  [176, 258],
  [291, 373],
  [415, 482]
];

// Sort in descending order to avoid messing up the indices when deleting
removeRanges.sort((a, b) => b[0] - a[0]);

for (const [start, end] of removeRanges) {
  lines.splice(start, end - start + 1);
}

const sharedModals = `
      {/* Vocab Details Modal */}
      {selectedVocab && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setSelectedVocab(null)}>
          <div 
            className="relative bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 sm:p-8 border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a] z-10 shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-white capitalize leading-tight">
                    {selectedVocab.term}
                  </h2>
                  <button 
                    onClick={(e) => playAudio(e, selectedVocab.term, targetLanguage)}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700 transition-colors shadow-sm mt-1"
                    title="Phát âm"
                  >
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                  </button>
                </div>
                <span className="text-gray-500 dark:text-neutral-400 text-base font-normal mt-1 block normal-case font-pronunciation">{selectedVocab.pronunciation}</span>
              </div>
              
              <div className="flex items-start gap-2">
                <button 
                  onClick={() => setSelectedVocab(null)}
                  className="text-gray-400 hover:text-gray-900 dark:text-white p-2 rounded-full hover:bg-gray-100 bg-gray-50 transition-colors shrink-0 dark:bg-neutral-900"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
              <div className="inline-flex items-center gap-2 mb-2 bg-blue-50 dark:bg-neutral-800 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-neutral-700">
                <span className="text-sm font-semibold text-blue-700 dark:text-white uppercase tracking-wider">{selectedVocab.part_of_speech}</span>
                <span className="text-blue-300">•</span>
                <span className="text-sm font-bold text-blue-700 dark:text-white">{selectedVocab.level}</span>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-2">Ý nghĩa</h3>
                <p className="text-gray-900 dark:text-white font-medium text-lg first-letter:uppercase">{selectedVocab.meaning_vi}</p>
                <p className="text-sm text-gray-500 dark:text-neutral-400 italic mt-1 bg-gray-50 p-2 rounded border border-gray-100 dark:bg-[#0a0a0a] dark:border-neutral-800">Ngữ cảnh: {selectedVocab.context_meaning_vi}</p>
              </div>

              {selectedVocab.usage_note_vi && (
                <div>
                  <h3 className="font-semibold text-gray-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-2">Cách dùng</h3>
                  <p className="text-gray-700 dark:text-neutral-200 leading-relaxed">{selectedVocab.usage_note_vi}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-3">Ví dụ</h3>
                <div className="bg-blue-50/70 dark:bg-neutral-900 p-4 rounded-xl border border-blue-100 dark:border-neutral-700 mb-3 shadow-sm">
                  <p className="font-medium text-gray-900 dark:text-white text-[15px] leading-relaxed">"{selectedVocab.original_sentence}"</p>
                  <p className="text-gray-600 dark:text-neutral-300 italic mt-2 text-sm">{selectedVocab.sentence_translation_vi}</p>
                </div>
                {selectedVocab.examples && selectedVocab.examples.map((ex, i) => (
                  <div key={i} className="pl-3 mt-3 border-l-2 border-blue-200 dark:border-neutral-700">
                    <p className="text-gray-800 dark:text-neutral-100 text-sm font-medium">{ex.sentence}</p>
                    <p className="text-gray-500 dark:text-neutral-400 italic text-sm mt-1">{ex.translationVi}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grammar Details Modal */}
      {selectedGrammar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setSelectedGrammar(null)}>
          <div 
            className="relative bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start p-6 sm:p-8 border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a] z-10 shrink-0">
              <div className="pr-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-purple-700 dark:text-white leading-tight mb-2">
                  {selectedGrammar.grammar_pattern}
                </h2>
                <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-neutral-800 px-2.5 py-1 rounded-md border border-purple-100 dark:border-neutral-700">
                  <span className="text-xs font-bold text-purple-700 dark:text-white uppercase tracking-wider">{selectedGrammar.level}</span>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedGrammar(null)}
                className="text-gray-400 hover:text-gray-900 dark:text-white p-2 rounded-full hover:bg-gray-100 bg-gray-50 transition-colors shrink-0 -mt-2 -mr-2 dark:bg-neutral-900"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
              <div>
                <h3 className="font-bold text-gray-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-2">Ý nghĩa</h3>
                <p className="text-gray-900 dark:text-white font-medium text-lg first-letter:uppercase">{selectedGrammar.meaning_vi}</p>
              </div>

              {selectedGrammar.explanation_vi && (
                <div>
                  <h3 className="font-bold text-gray-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-2">Cách dùng (Giải thích)</h3>
                  <p className="text-gray-700 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">{selectedGrammar.explanation_vi}</p>
                </div>
              )}

              <div>
                <h3 className="font-bold text-gray-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-3">Ví dụ trong Video</h3>
                <div className="bg-purple-50 dark:bg-neutral-800 p-5 rounded-xl border border-purple-200 dark:border-neutral-700 mb-5 shadow-sm">
                  <p className="font-medium text-purple-900 dark:text-white text-[15px] leading-relaxed">"{selectedGrammar.original_sentence}"</p>
                  <p className="text-purple-700 dark:text-neutral-300 italic mt-2 text-sm">{selectedGrammar.sentence_translation_vi}</p>
                  <button 
                    className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors shrink-0 text-slate-500 dark:text-neutral-400 mt-2"
                    onClick={(e) => playAudio(e, selectedGrammar.original_sentence, targetLanguage)}
                    title="Nghe phát âm"
                  >
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                  </button>
                </div>
                
                {selectedGrammar.examples && selectedGrammar.examples.length > 0 && (
                  <div className="mt-5">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-neutral-400 mb-3">Ví dụ bổ sung:</h4>
                    <div className="space-y-4 pl-1">
                      {selectedGrammar.examples.map((ex, i) => (
                        <div key={i} className="pl-3 border-l-2 border-purple-200 dark:border-neutral-700">
                          <p className="text-gray-800 dark:text-neutral-100 text-sm font-medium">{ex.sentence}</p>
                          <p className="text-gray-500 dark:text-neutral-400 italic text-sm mt-1">{ex.translationVi}</p>
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
`;

let newCode = lines.join('\n');

// Find the last export to append before
newCode = newCode.replace(/    <\/div>\s*<\/div>\s*\)\s*\}\s*export/, `    </div>\n${sharedModals}\n    </div>\n  );\n}\nexport`);

fs.writeFileSync('src/components/video/VideoWorkspaceClient.tsx', newCode);
