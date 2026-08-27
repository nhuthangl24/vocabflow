"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import ReactPlayer from "react-player";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Check, Eye, EyeOff, Lightbulb, CheckCircle, XCircle } from "lucide-react";


// Simple LCS Diff for word/character level highlighting
function computeDiff(original: string, input: string) {
  const tokenRegex = /[\u4e00-\u9fa5]|[a-zA-Z0-9À-ỹ]+|[^a-zA-Z0-9À-ỹ\u4e00-\u9fa5]+/g;
  const origTokens = original.match(tokenRegex) || [];
  const inputTokens = input.match(tokenRegex) || [];
  
  const m = origTokens.length;
  const n = inputTokens.length;
  const dp = Array.from({length: m + 1}, () => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origTokens[i-1].toLowerCase() === inputTokens[j-1].toLowerCase()) {
        dp[i][j] = dp[i-1][j-1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }
  }
  
  let i = m, j = n;
  const result: { type: 'match' | 'missing' | 'extra', value: string }[] = [];
  while (i > 0 && j > 0) {
    if (origTokens[i-1].toLowerCase() === inputTokens[j-1].toLowerCase()) {
      result.unshift({ type: 'match', value: origTokens[i-1] });
      i--; j--;
    } else if (dp[i-1][j] > dp[i][j-1]) {
      result.unshift({ type: 'missing', value: origTokens[i-1] });
      i--;
    } else {
      result.unshift({ type: 'extra', value: inputTokens[j-1] });
      j--;
    }
  }
  while (i > 0) { result.unshift({ type: 'missing', value: origTokens[i-1] }); i--; }
  while (j > 0) { result.unshift({ type: 'extra', value: inputTokens[j-1] }); j--; }
  
  return result;
}

export default function ShadowingWorkspaceClient({ videoUrl, transcript = [] }: { videoUrl: string, transcript: any[] }) {
  const playerRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Dictation states
  const [dictations, setDictations] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [checkResult, setCheckResult] = useState<Record<number, boolean | null>>({});
  const [diffResult, setDiffResult] = useState<Record<number, any[]>>({});

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

  const currentIndex = useMemo(() => {
    if (!transcript || transcript.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < transcript.length; i++) {
      if (transcript[i].start_time_ms / 1000 <= currentTime + 0.5) {
        idx = i;
      } else {
        break;
      }
    }
    return idx === -1 ? 0 : idx;
  }, [currentTime, transcript]);

  const currentSegment = currentIndex >= 0 ? transcript[currentIndex] : null;

  const performSeek = (time: number) => {
    try {
      if (typeof playerRef.current?.seekTo === 'function') {
        playerRef.current.seekTo(time, 'seconds');
      } else if (playerRef.current?.getInternalPlayer) {
        const internal = playerRef.current.getInternalPlayer();
        if (typeof internal?.seekTo === 'function') {
          internal.seekTo(time, true);
        } else if (internal && typeof internal.currentTime !== 'undefined') {
          internal.currentTime = time;
        }
      } else if (playerRef.current && typeof playerRef.current.currentTime !== 'undefined') {
        playerRef.current.currentTime = time;
      }
    } catch (e) {
      console.error('Seek error:', e);
    }
    setIsPlaying(true);
  };

  const handleSeek = (index: number) => {
    if (index >= 0 && index < transcript.length) {
      const seekTime = transcript[index].start_time_ms / 1000;
      setCurrentTime(seekTime);
      performSeek(seekTime);
    }
  };

  const handleReplay = () => {
    if (currentSegment) {
      performSeek(currentSegment.start_time_ms / 1000);
      setIsPlaying(true);
    }
  };

  // Hint logic: find the first character that differs and reveal it
  const handleHint = () => {
    if (!currentSegment) return;
    const original = currentSegment.text;
    const currentInput = dictations[currentIndex] || "";
    
    let hintStr = currentInput;
    for (let i = 0; i < original.length; i++) {
      if (i >= currentInput.length || currentInput[i] !== original[i]) {
        hintStr = original.slice(0, i + 1);
        break;
      }
    }
    setDictations({ ...dictations, [currentIndex]: hintStr });
    setCheckResult({ ...checkResult, [currentIndex]: null }); setDiffResult({ ...diffResult, [currentIndex]: [] });
  };

  // Check logic: normalize and compare
  const handleCheck = () => {
    if (!currentSegment) return;
    
    // Basic normalization: remove punctuation and whitespace for comparison
    const normalize = (str: string) => str.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
    
    const originalClean = normalize(currentSegment.text);
    const inputClean = normalize(dictations[currentIndex] || "");
    
    if (originalClean === inputClean && originalClean.length > 0) {
      setCheckResult({ ...checkResult, [currentIndex]: true });
      setDiffResult({ ...diffResult, [currentIndex]: computeDiff(currentSegment.text, dictations[currentIndex] || "") });
    } else {
      setCheckResult({ ...checkResult, [currentIndex]: false });
      setDiffResult({ ...diffResult, [currentIndex]: computeDiff(currentSegment.text, dictations[currentIndex] || "") });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full mt-6">
      <div className="w-full lg:w-6/12 shrink-0">
        <div className="sticky top-6">
          <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-neutral-800">
            {isMounted ? (
              <ReactPlayer
                ref={playerRef}
                url={videoUrl}
                width="100%"
                height="100%"
                controls={true}
                playing={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onProgress={({ playedSeconds }: any) => setCurrentTime(playedSeconds)}
                progressInterval={200}

              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white">Loading player...</div>
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-neutral-400 font-medium px-2">
            
            <span>{currentIndex >= 0 ? `${currentIndex + 1} / ${transcript.length}` : '0 / 0'}</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-6/12">
        <div className="w-full bg-white dark:bg-[#0a0a0a] rounded-3xl shadow-sm border border-slate-200 dark:border-neutral-800 p-6 flex flex-col min-h-[400px]">
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-slate-900 dark:text-white text-xl">Luyện tập Chép chính tả</h2>
            <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-sm font-bold tracking-wide">
              Câu {currentIndex + 1}
            </div>
          </div>

          {currentSegment ? (
            <div className="flex flex-col flex-1">
              
              <div className="flex-1 relative">
                <textarea
                  value={dictations[currentIndex] || ""}
                  onChange={(e) => {
                    setDictations({ ...dictations, [currentIndex]: e.target.value });
                    if (checkResult[currentIndex] !== null) {
                      setCheckResult({ ...checkResult, [currentIndex]: null });
                      setDiffResult({ ...diffResult, [currentIndex]: [] });
                    }
                  }}
                  placeholder="Nghe video và chép lại chính tả vào đây..."
                  className={`w-full h-40 bg-slate-50 dark:bg-neutral-900 border-2 rounded-2xl p-5 text-lg font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none transition-all ${
                    checkResult[currentIndex] === true ? 'border-green-400 focus:ring-4 focus:ring-green-500/10' :
                    checkResult[currentIndex] === false ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' :
                    'border-slate-100 dark:border-neutral-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                  }`}
                />
                
                {/* Result Indicator Badge */}
                {checkResult[currentIndex] === true && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
                    <CheckCircle className="w-4 h-4" /> Chính xác
                  </div>
                )}
                {checkResult[currentIndex] === false && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
                    <XCircle className="w-4 h-4" /> Chưa đúng
                  </div>
                )}
              </div>
                {/* Diff Result Overlay */}
                {checkResult[currentIndex] === false && diffResult[currentIndex]?.length > 0 && (
                  <div className="mt-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-5">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-1.5"><XCircle className="w-4 h-4"/> Sửa lỗi:</p>
                    <div className="flex flex-wrap gap-x-0.5 gap-y-2 text-lg font-medium leading-relaxed">
                      {diffResult[currentIndex].map((t: any, idx: number) => {
                        const isSpaceOrPunct = /[^a-zA-Z0-9À-ỹ\u4e00-\u9fa5]/.test(t.value);
                        if (t.type === 'match') return <span key={idx} className={`text-green-600 dark:text-green-400 font-bold ${!isSpaceOrPunct ? 'bg-green-100 dark:bg-green-900/30 px-1 rounded-md' : ''}`}>{t.value}</span>;
                        if (t.type === 'extra') return <span key={idx} className={`text-red-500 dark:text-red-400 font-bold ${!isSpaceOrPunct ? 'bg-red-100 dark:bg-red-900/30 px-1 rounded-md' : ''}`}>{t.value}</span>;
                        if (t.type === 'missing') {
                          if (isSpaceOrPunct) return <span key={idx} className="text-slate-400">{t.value}</span>;
                          return <span key={idx} className="text-slate-400 font-bold tracking-widest mx-1">***</span>;
                        }
                      })}
                    </div>
                  </div>
                )}


              {/* Action Buttons: Hint, Check, Reveal */}
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={handleHint}
                  className="flex-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Lightbulb className="w-5 h-5" /> Gợi ý (1 từ)
                </button>

                <button
                  onClick={handleCheck}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Check className="w-5 h-5" /> Kiểm tra
                </button>
              </div>

              <div className="mt-4">
                {revealed[currentIndex] ? (
                  <div className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 p-5 rounded-2xl relative">
                    <p className="text-slate-800 dark:text-neutral-200 text-lg leading-relaxed font-semibold">
                      {currentSegment.text}
                    </p>
                    <button 
                      onClick={() => setRevealed({ ...revealed, [currentIndex]: false })}
                      className="absolute top-3 right-3 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                    >
                      <EyeOff className="w-3.5 h-3.5" /> Ẩn đi
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setRevealed({ ...revealed, [currentIndex]: true })}
                    className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-neutral-700 rounded-xl text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-300 font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <Eye className="w-5 h-5" />
                    Xem đáp án (Văn bản gốc)
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100 dark:border-neutral-800">
                <button 
                  onClick={() => handleSeek(currentIndex - 1)}
                  disabled={currentIndex <= 0}
                  className="p-3 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 disabled:opacity-30 transition-colors"
                  title="Câu trước"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button 
                  onClick={handleReplay}
                  className="px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 transition-colors shadow-sm shadow-indigo-600/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  Nghe lại câu này
                </button>

                <button 
                  onClick={() => handleSeek(currentIndex + 1)}
                  disabled={currentIndex >= transcript.length - 1}
                  className="p-3 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 disabled:opacity-30 transition-colors"
                  title="Câu tiếp theo"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 italic">
              Video này chưa có phụ đề để luyện tập.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
