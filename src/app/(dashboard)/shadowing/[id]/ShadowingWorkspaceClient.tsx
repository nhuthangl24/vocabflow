"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Check, Eye, EyeOff, Lightbulb, CheckCircle, XCircle, Flag } from "lucide-react";
import { saveShadowingProgress } from "@/app/actions/shadowing";
import { useAnalytics } from "@/hooks/useAnalytics";


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
  const result: { type: 'match' | 'missing' | 'extra', value: string, origIdx?: number }[] = [];
  while (i > 0 && j > 0) {
    if (origTokens[i-1].toLowerCase() === inputTokens[j-1].toLowerCase()) {
      result.unshift({ type: 'match', value: origTokens[i-1], origIdx: i - 1 });
      i--; j--;
    } else if (dp[i-1][j] > dp[i][j-1]) {
      result.unshift({ type: 'missing', value: origTokens[i-1], origIdx: i - 1 });
      i--;
    } else {
      result.unshift({ type: 'extra', value: inputTokens[j-1] });
      j--;
    }
  }
  while (i > 0) { result.unshift({ type: 'missing', value: origTokens[i-1], origIdx: i - 1 }); i--; }
  while (j > 0) { result.unshift({ type: 'extra', value: inputTokens[j-1] }); j--; }
  
  return result;
}

const YOUTUBE_OPTS = { width: '100%', height: '100%', playerVars: { autoplay: 0, rel: 0 } };

export default function ShadowingWorkspaceClient({ assetId, videoUrl, transcript = [] }: { assetId: string, videoUrl: string, transcript: any[] }) {
  const { trackEvent } = useAnalytics("ShadowingRoom");
  const [player, setPlayer] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // UI states
  const [activeTab, setActiveTab] = useState<"dictation" | "shadowing">("dictation");
  const [hideVideo, setHideVideo] = useState(false);
  
  // CC Report states
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedSegmentToReport, setSelectedSegmentToReport] = useState<any>(null);
  const [reportCategory, setReportCategory] = useState("subtitle_error");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSuggestion, setReportSuggestion] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  
  const handleReportSubmit = async () => {
    if (!selectedSegmentToReport) return;
    setIsReporting(true);
    
    try {
      const { toast } = await import("react-hot-toast");
      const res = await fetch("/api/user/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: assetId,
          segment_id: selectedSegmentToReport.id,
          category: reportCategory,
          description: reportDesc,
          suggestion: { correct_text: reportSuggestion },
          language: "auto", // Could be from asset data
          room: "shadowing"
        })
      });
      
      const data = await res.json();
      
      if (res.status === 409 && data.duplicate) {
        toast.error(
          (t) => (
            <div className="flex flex-col gap-2">
              <span className="font-bold text-sm">Lỗi này đã có người báo cáo!</span>
              <span className="text-xs">Bạn có muốn +1 Vote để Admin ưu tiên xử lý không?</span>
              <div className="flex gap-2 mt-1">
                <button 
                  onClick={async () => {
                    toast.dismiss(t.id);
                    await fetch("/api/user/reports/vote", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ report_id: data.existingReportId })
                    });
                    toast.success("Đã thêm Vote!");
                    setShowReportModal(false);
                  }}
                  className="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold w-full"
                >
                  👍 Tôi cũng gặp
                </button>
              </div>
            </div>
          ),
          { duration: 10000 }
        );
      } else if (res.ok) {
        toast.success("Đã gửi báo lỗi thành công! Cảm ơn bạn.");
        setShowReportModal(false);
        setReportDesc("");
        setReportSuggestion("");
      } else {
        toast.error(`Có lỗi xảy ra: ${data.error}`);
      }
    } catch (e) {
      import("react-hot-toast").then(t => t.default.error("Lỗi mạng"));
    } finally {
      setIsReporting(false);
    }
  };
  
  // extract video ID for YouTube
  const videoId = useMemo(() => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = videoUrl?.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }, [videoUrl]);

  // Dictation states
  const [dictations, setDictations] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [checkResult, setCheckResult] = useState<Record<number, boolean | null>>({});
  const [diffResult, setDiffResult] = useState<Record<number, any[]>>({});
  const [hintedTokens, setHintedTokens] = useState<Record<number, number[]>>({});

  const [duration, setDuration] = useState(0);

  const currentIndex = useMemo(() => {
    if (!transcript || transcript.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < transcript.length; i++) {
      if (transcript[i].start_time_ms / 1000 <= currentTime + 0.01) { // strict precision to avoid leaking into next segment
        idx = i;
      } else {
        break;
      }
    }
    return idx === -1 ? 0 : idx;
  }, [currentTime, transcript]);

  const currentSegment = currentIndex >= 0 ? transcript[currentIndex] : null;

  const dictationIndexRef = useRef<number>(currentIndex);

  useEffect(() => {
    if (activeTab === "dictation") {
      dictationIndexRef.current = currentIndex;
    }
  }, [activeTab]); // lock segment index when entering dictation tab

  useEffect(() => {
    let interval: any;
    if (isPlaying && player && videoId) {
      interval = setInterval(async () => {
        try {
          const time = await player.getCurrentTime();
          setCurrentTime(time);
          if (!duration) setDuration(await player.getDuration());
          
          if (activeTab === "dictation") {
            const targetSegment = transcript[dictationIndexRef.current];
            if (targetSegment) {
              const endTime = targetSegment.end_time_ms / 1000 + 0.2;
              if (time >= endTime) {
                player.pauseVideo();
                setIsPlaying(false);
              }
            }
          }
        } catch (e) {}
      }, 100);
    } else if (isPlaying && videoRef.current && !videoId) {
      interval = setInterval(() => {
        const time = videoRef.current!.currentTime;
        setCurrentTime(time);
        if (!duration && videoRef.current!.duration) setDuration(videoRef.current!.duration);

        if (activeTab === "dictation") {
          const targetSegment = transcript[dictationIndexRef.current];
          if (targetSegment) {
            const endTime = targetSegment.end_time_ms / 1000 + 0.2;
            if (time >= endTime) {
              videoRef.current!.pause();
              setIsPlaying(false);
            }
          }
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, player, videoId, activeTab, currentSegment, duration]);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    setPlayer(event.target);
    setDuration(event.target.getDuration());
  };
  
  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (event.data === 1) setIsPlaying(true);
    else if (event.data === 2 || event.data === 0) setIsPlaying(false);
  };

  

  // Auto-scroll logic for Shadowing tab
  useEffect(() => {
    if (activeTab === "shadowing") {
      const el = document.getElementById(`shadowing-segment-${currentIndex}`);
      const container = document.getElementById('shadowing-scroll-container');
      if (el && container) {
        // smooth scroll the container so the element is roughly centered
        const containerHalf = container.clientHeight / 2;
        const elHalf = el.clientHeight / 2;
        container.scrollTo({
          top: el.offsetTop - container.offsetTop - containerHalf + elHalf,
          behavior: 'smooth'
        });
      }
    }
  }, [currentIndex, activeTab]);

  const performSeek = (time: number) => {
    try {
      if (player && videoId) {
        player.seekTo(time, true);
        player.playVideo();
      } else if (videoRef.current && !videoId) {
        videoRef.current.currentTime = time;
        videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error('Seek error:', e);
    }
  };

  const handleSeek = (index: number) => {
    if (index >= 0 && index < transcript.length) {
      if (activeTab === "dictation") dictationIndexRef.current = index;
      const seekTime = transcript[index].start_time_ms / 1000;
      setCurrentTime(seekTime);
      performSeek(seekTime);
      trackEvent("Seek", `Segment ${index}`, seekTime, { tab: activeTab, assetId });
    }
  };

  const handleReplay = () => {
    if (currentSegment) {
      performSeek(currentSegment.start_time_ms / 1000);
      trackEvent("Replay", `Segment ${currentIndex}`, currentTime, { tab: activeTab, assetId });
    }
  };

  const handleTogglePlayPause = () => {
    if (isPlaying) {
      if (player && videoId) player.pauseVideo();
      else if (videoRef.current) videoRef.current!.pause();
      setIsPlaying(false);
      trackEvent("Pause", `Time ${currentTime}`, currentTime, { tab: activeTab, assetId });
    } else {
      if (player && videoId) player.playVideo();
      else if (videoRef.current) videoRef.current!.play();
      setIsPlaying(true);
      trackEvent("Play", `Time ${currentTime}`, currentTime, { tab: activeTab, assetId });
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return "0:00";
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Hint logic: find the first missing word and reveal it in the asterisk box
  const handleHint = () => {
    if (!currentSegment) return;
    const diff = computeDiff(currentSegment.text, dictations[currentIndex] || "");
    const missingToken = diff.find(t => t.type === 'missing' && !/[^a-zA-Z0-9À-ỹ\u4e00-\u9fa5]/.test(t.value) && !(hintedTokens[currentIndex] || []).includes(t.origIdx!));
    if (missingToken && missingToken.origIdx !== undefined) {
      const currentHints = hintedTokens[currentIndex] || [];
      setHintedTokens({ ...hintedTokens, [currentIndex]: [...currentHints, missingToken.origIdx] });
    }
  };

  // Check logic: normalize and compare
  const handleCheck = () => {
    if (!currentSegment) return;
    
    // Loose check: remove punctuation and whitespace, ignore case
    const normalize = (str: string) => str.replace(/[^a-zA-Z0-9À-ỹ\u4e00-\u9fa5]/g, '').toLowerCase();
    
    const originalClean = normalize(currentSegment.text);
    const inputClean = normalize(dictations[currentIndex] || "");
    
    if (originalClean === inputClean && originalClean.length > 0) {
      setCheckResult({ ...checkResult, [currentIndex]: true });
      setDiffResult({ ...diffResult, [currentIndex]: computeDiff(currentSegment.text, dictations[currentIndex] || "") });
      
      // Save progress to database
      saveShadowingProgress(assetId, currentSegment.id).catch(err => console.error("Failed to save progress", err));

      // Auto-next if completely correct
      if (currentIndex < transcript.length - 1) {
        setTimeout(() => {
          handleSeek(currentIndex + 1);
        }, 800);
      }
    } else {
      setCheckResult({ ...checkResult, [currentIndex]: false });
      setDiffResult({ ...diffResult, [currentIndex]: computeDiff(currentSegment.text, dictations[currentIndex] || "") });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full mt-6">
      <div className="w-full lg:w-6/12 shrink-0">
        <div className="sticky top-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700 dark:text-neutral-300">Trình phát</h3>
            <button 
              onClick={() => setHideVideo(!hideVideo)}
              className="flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full transition-colors"
            >
              {hideVideo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {hideVideo ? "Hiện video" : "Ẩn video (Chỉ nghe)"}
            </button>
          </div>

          {hideVideo && (
            // Modern Slim Audio Player UI
            <div className="w-full bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-[32px] p-2.5 pr-6 flex items-center gap-4 shadow-[0_12px_40px_rgb(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all">
              <button 
                onClick={handleTogglePlayPause}
                className="w-14 h-14 shrink-0 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 rounded-full flex items-center justify-center text-white dark:text-black transition-transform hover:scale-105 active:scale-95 shadow-md"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-1 fill-current" />}
              </button>
              
              <div className="text-sm font-bold text-slate-800 dark:text-neutral-200 w-12 text-right tabular-nums">
                {formatTime(currentTime)}
              </div>
              
              <div className="flex-1 relative flex items-center group h-8">
                <input 
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => {
                    const newTime = parseFloat(e.target.value);
                    setCurrentTime(newTime);
                    performSeek(newTime);
                  }}
                  className="w-full h-1.5 bg-slate-300/50 dark:bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-slate-900 dark:[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100 [&::-webkit-slider-thumb]:transition-opacity [&::-webkit-slider-thumb]:shadow-sm z-10 relative bg-transparent"
                />
                {/* Progress fill bar */}
                <div 
                  className="absolute left-0 h-1.5 bg-slate-900 dark:bg-white rounded-full pointer-events-none transition-all" 
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
              </div>

              <div className="text-sm font-bold text-slate-400 dark:text-neutral-500 w-14 tabular-nums">
                -{formatTime(duration - currentTime)}
              </div>
            </div>
          )}

          {/* Single player instance — always mounted, visibility toggled via CSS to preserve playback state */}
          <div className={hideVideo ? "w-0 h-0 overflow-hidden absolute pointer-events-none opacity-0" : "relative aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-neutral-800"}>
            {videoId ? (
              <YouTube 
                videoId={videoId}
                opts={YOUTUBE_OPTS}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
                className="w-full h-full absolute inset-0"
                iframeClassName="w-full h-full"
              />
            ) : (
              <video
                ref={videoRef}
                src={videoUrl}
                controls={!hideVideo}
                className="w-full h-full object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              />
            )}
          </div>

          {/* Active Subtitle Box */}
          {currentSegment && activeTab === "shadowing" && (
            <div className="mt-6 bg-white dark:bg-[#121212] rounded-3xl shadow-lg border border-slate-200 dark:border-neutral-800 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[140px] lg:min-h-[160px]" style={{ width: '100%' }}>
               {/* Render Words */}
               {(() => {
                 if (currentSegment.words && Array.isArray(currentSegment.words) && currentSegment.words.length > 0) {
                   return (
                     <div className="w-full text-center flex-1 flex flex-col justify-center">
                       <div className="w-full max-w-[520px] mx-auto flex flex-wrap justify-center items-end gap-y-6 gap-x-1">
                         {currentSegment.words.map((wordObj: any, idx: number) => {
                           const isActiveWord = currentTime >= wordObj.start && currentTime <= wordObj.end;
                           const text = wordObj.text; // don't trim to preserve spacing if any, or trim for centered alignment
                           let ipaTokens = [];
                           if (currentSegment.ipa) {
                             ipaTokens = currentSegment.ipa.replace(/^\/|\/$/g, '').trim().split(/\s+/);
                           }
                           const ipaWord = ipaTokens.length === currentSegment.words.length ? ipaTokens[idx] : "";

                           return (
                             <span key={idx} className={`inline-flex flex-col items-center mx-1 align-bottom transition-all duration-200 ${isActiveWord ? 'scale-110' : ''}`}>
                               {ipaWord && (
                                 <span className={`text-[12px] font-mono font-medium tracking-wide mb-1 leading-none transition-colors duration-200 ${isActiveWord ? 'text-indigo-600 dark:text-indigo-300' : 'text-indigo-500/70 dark:text-indigo-400/70'}`}>
                                   {ipaWord}
                                 </span>
                               )}
                               <span className={`text-[22px] lg:text-[25px] font-bold leading-none transition-colors duration-200 ${isActiveWord ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-white'}`}>
                                 {text.trim()}
                               </span>
                             </span>
                           );
                         })}
                       </div>
                     </div>
                   );
                 }

                 const textTokens = currentSegment.text.trim().split(/\s+/);
                 let ipaTokens = [];
                 if (currentSegment.ipa) {
                    ipaTokens = currentSegment.ipa.replace(/^\/|\/$/g, '').trim().split(/\s+/);
                 }

                 return (
                   <div className="w-full text-center flex-1 flex flex-col justify-center">
                     <div className="leading-[2.75rem] lg:leading-[3.25rem] w-full max-w-[520px] mx-auto">
                       {textTokens.map((word: string, idx: number) => {
                         const ipaWord = ipaTokens[idx] || "";

                         return (
                           <span key={idx} className="inline-flex flex-col items-center mx-1.5 align-bottom">
                             {ipaWord && (
                               <span className="text-[12px] font-mono text-indigo-500 dark:text-indigo-400 font-medium tracking-wide mb-0.5 leading-none">
                                 {ipaWord}
                               </span>
                             )}
                             <span className="text-[22px] lg:text-[25px] font-bold text-slate-800 dark:text-white leading-none">
                               {word}
                             </span>
                           </span>
                         );
                       })}
                     </div>
                   </div>
                 );
               })()}

               {/* Translation */}
               {(currentSegment.translation_vi || currentSegment.translation) && (
                 <div className="mt-8 pt-6 border-t border-slate-100 dark:border-neutral-800/60 w-full text-slate-500 dark:text-neutral-400 font-medium text-lg">
                   {currentSegment.translation_vi || currentSegment.translation}
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-6/12">
        <div className="w-full h-[calc(100vh-12rem)] bg-white dark:bg-[#121212] rounded-3xl shadow-lg border border-slate-200 dark:border-neutral-800 p-6 flex flex-col">
          
          <div className="flex justify-between items-center mb-6 pb-2">
            <div className="flex bg-slate-100 dark:bg-[#121212] p-1 rounded-xl border border-slate-200 dark:border-neutral-800/80 shadow-inner">
              <button
                onClick={() => setActiveTab("dictation")}
                className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  activeTab === "dictation" 
                    ? "bg-white dark:bg-[#222222] text-slate-800 dark:text-neutral-200 shadow-sm border border-slate-200 dark:border-neutral-700/50" 
                    : "text-slate-500 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-300"
                }`}
              >
                Chép chính tả
              </button>
              <button
                onClick={() => setActiveTab("shadowing")}
                className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  activeTab === "shadowing" 
                    ? "bg-indigo-50 dark:bg-[#1a1a2e] text-indigo-700 dark:text-indigo-400 shadow-sm border border-indigo-200 dark:border-indigo-500/20" 
                    : "text-slate-500 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-300"
                }`}
              >
                Đọc theo (Shadowing)
              </button>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide border border-indigo-200 dark:border-indigo-700/40">
              Câu {currentIndex + 1}
            </div>
          </div>

          {currentSegment ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              
              {activeTab === "dictation" ? (
                // --- DICTATION TAB ---
                <div className="flex flex-col flex-1 overflow-y-auto pr-2">
                  <div className="relative">
                    <textarea
                      value={dictations[currentIndex] || ""}
                      onChange={(e) => {
                        setDictations({ ...dictations, [currentIndex]: e.target.value });
                        if (checkResult[currentIndex] !== null) {
                          setCheckResult({ ...checkResult, [currentIndex]: null });
                          setDiffResult({ ...diffResult, [currentIndex]: [] });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCheck();
                        } else if (e.key === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          if (currentIndex > 0) handleSeek(currentIndex - 1);
                        } else if (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          if (currentIndex < transcript.length - 1) handleSeek(currentIndex + 1);
                        }
                      }}
                      placeholder="Nghe video và chép lại chính tả vào đây... (Nhấn Enter để kiểm tra)"
                      className={`w-full h-40 bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 text-lg font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none resize-none transition-all ${
                        checkResult[currentIndex] === true ? 'border-green-500/50 focus:ring-4 focus:ring-green-500/10' :
                        checkResult[currentIndex] === false ? 'border-red-500/50 focus:ring-4 focus:ring-red-500/10' :
                        'focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                      }`}
                    />
                  </div>

                  {/* Result Indicator Badge (Moved Outside) */}
                  <div className="min-h-[2rem] mt-2 flex justify-end">
                    {checkResult[currentIndex] === true && (
                      <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm border border-green-200 dark:border-green-500/30">
                        <CheckCircle className="w-4 h-4" /> Chính xác
                      </div>
                    )}
                    {checkResult[currentIndex] === false && (
                      <div className="flex items-center gap-1.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm border border-red-200 dark:border-red-500/30">
                        <XCircle className="w-4 h-4" /> Chưa đúng
                      </div>
                    )}
                  </div>

                  {/* Asterisk Indicator / Feedback */}
                  <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-2xl mt-4 p-4 border border-slate-200 dark:border-neutral-800 flex flex-wrap gap-x-1 gap-y-2 min-h-[4rem] items-center text-lg font-medium text-slate-800 dark:text-neutral-200">
                    {checkResult[currentIndex] === null || checkResult[currentIndex] === undefined ? (
                      currentSegment.text.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9À-ỹ]+|[^a-zA-Z0-9À-ỹ\u4e00-\u9fa5]+/g)?.map((token: string, i: number) => {
                        const isSpaceOrPunct = /[^a-zA-Z0-9À-ỹ\u4e00-\u9fa5]/.test(token);
                        if (isSpaceOrPunct) return <span key={i} className="text-slate-400 dark:text-neutral-500 whitespace-pre">{token}</span>;
                        
                        const isHinted = (hintedTokens[currentIndex] || []).includes(i);
                        if (isHinted) return <span key={i} className="text-amber-500 font-bold">{token}</span>;

                        return (
                          <div key={i} className="flex flex-col items-center justify-center min-w-[12px]">
                            <span className="text-red-500 font-black text-lg leading-none h-4">*</span>
                            <span className="text-slate-300 dark:text-neutral-500 font-bold leading-none">-</span>
                          </div>
                        );
                      })
                    ) : (
                      diffResult[currentIndex]?.filter((t: any) => t.type !== 'extra').map((t: any, idx: number) => {
                        const isSpaceOrPunct = /[^a-zA-Z0-9À-ỹ\u4e00-\u9fa5]/.test(t.value);
                        if (isSpaceOrPunct) return <span key={idx} className="text-slate-400 dark:text-neutral-500 whitespace-pre">{t.value}</span>;
                        if (t.type === 'match') return <span key={idx} className="text-green-600 dark:text-green-400 font-bold">{t.value}</span>;
                        
                        const isHinted = (hintedTokens[currentIndex] || []).includes(t.origIdx);
                        if (isHinted) return <span key={idx} className="text-amber-500 font-bold">{t.value}</span>;

                        return (
                          <div key={idx} className="flex flex-col items-center justify-center min-w-[12px] mx-1">
                            <span className="text-red-500 font-black text-lg leading-none h-4">*</span>
                            <span className="text-slate-300 dark:text-neutral-500 font-bold leading-none">-</span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Action Buttons: Hint, Check, Reveal */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      onClick={handleHint}
                      className="flex-1 bg-amber-900/20 hover:bg-amber-900/40 border border-amber-700/30 text-amber-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Lightbulb className="w-5 h-5" /> Gợi ý (1 từ)
                    </button>

                    <button
                      onClick={handleCheck}
                      className="flex-1 bg-indigo-900/20 hover:bg-indigo-900/40 border border-indigo-700/30 text-indigo-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Check className="w-5 h-5" /> Kiểm tra
                    </button>
                  </div>

                  <div className="mt-4">
                    {revealed[currentIndex] ? (
                      <div className="bg-slate-50 dark:bg-[#1a1a1a] border border-slate-300 dark:border-neutral-700 p-5 rounded-2xl relative border-dashed">
                        <p className="text-slate-800 dark:text-neutral-200 text-lg leading-relaxed font-semibold">
                          {currentSegment.text}
                        </p>
                        <button 
                          onClick={() => setRevealed({ ...revealed, [currentIndex]: false })}
                          className="absolute top-3 right-3 text-xs font-bold text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200 bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                        >
                          <EyeOff className="w-3.5 h-3.5" /> Ẩn đi
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRevealed({ ...revealed, [currentIndex]: true })}
                        className="w-full py-3 border border-dashed border-slate-300 dark:border-neutral-700 rounded-xl text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-300 font-semibold flex items-center justify-center gap-2 transition-all bg-slate-50 dark:bg-[#1a1a1a]"
                      >
                        <Eye className="w-5 h-5" />
                        Xem đáp án (Văn bản gốc)
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-center mt-6 pt-5 border-t border-slate-200 dark:border-neutral-800">
                    <span className="text-sm font-bold text-neutral-500 mb-2 block w-full text-center">{currentIndex >= 0 ? `${currentIndex + 1} / ${transcript.length}` : '0 / 0'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <button 
                      onClick={() => handleSeek(currentIndex - 1)}
                      disabled={currentIndex <= 0}
                      className="px-4 py-2 rounded-full bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 disabled:opacity-30 transition-colors flex items-center gap-2 text-sm font-bold border border-slate-200 dark:border-neutral-800 shadow-sm"
                    >
                      <SkipBack className="w-4 h-4" /> Trước
                    </button>

                    <button 
                      onClick={handleReplay}
                      className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-2 font-bold shadow-lg shadow-indigo-600/20"
                    >
                      <RotateCcw className="w-4 h-4" /> Nghe lại câu này
                    </button>

                    <button 
                      onClick={() => handleSeek(currentIndex + 1)}
                      disabled={currentIndex >= transcript.length - 1}
                      className="px-4 py-2 rounded-full bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 disabled:opacity-30 transition-colors flex items-center gap-2 text-sm font-bold border border-slate-200 dark:border-neutral-800 shadow-sm"
                    >
                      Tiếp <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                // --- SHADOWING TAB ---
                <div 
                  id="shadowing-scroll-container"
                  className="flex-1 overflow-y-auto pr-2 space-y-4 shadow-inner-custom scroll-smooth"
                >
                  {transcript.map((segment, index) => {
                    const isActive = currentIndex === index;
                    return (
                      <div 
                        key={index} 
                        id={`shadowing-segment-${index}`}
                        data-active={isActive}
                        onClick={() => handleSeek(index)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-indigo-50 dark:bg-[#131126] border-indigo-300 dark:border-indigo-600/50 shadow-[0_0_20px_rgba(79,70,229,0.15)]' 
                            : 'bg-white dark:bg-[#151515] border-slate-200 dark:border-[#2a2a2a] hover:border-slate-300 dark:hover:border-[#3a3a3a]'
                        }`}
                      >
                        <div className="flex gap-4 items-start">
                          <div className={`shrink-0 text-sm font-bold mt-1.5 min-w-[36px] flex justify-center ${
                            isActive ? 'bg-indigo-600 text-white px-1.5 py-0.5 rounded-md text-center' : 'text-slate-400 dark:text-neutral-500'
                          }`}>
                            #{index + 1}
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <p className={`text-[19px] font-semibold leading-relaxed tracking-wide ${isActive ? 'text-indigo-900 dark:text-white' : 'text-slate-700 dark:text-neutral-300'}`}>
                              {segment.text}
                            </p>
                          </div>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSegmentToReport(segment);
                              setShowReportModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                            title="Báo lỗi phụ đề hoặc bản dịch"
                          >
                            <Flag className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-500 italic">
              Video này chưa có phụ đề để luyện tập.
            </div>
          )}

        </div>
      </div>

      {/* CC Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !isReporting && setShowReportModal(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 dark:border-neutral-800 animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center shrink-0 bg-slate-50/50 dark:bg-neutral-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                <Flag className="w-5 h-5 text-red-500" /> Báo lỗi phụ đề
              </h3>
              <button disabled={isReporting} onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors bg-white dark:bg-neutral-800 p-1.5 rounded-full shadow-sm border border-slate-200 dark:border-neutral-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Context display */}
              <div className="bg-slate-50 dark:bg-[#151515] rounded-xl p-4 border border-slate-200 dark:border-neutral-800 shadow-inner">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">Video hiện tại</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 bg-white dark:bg-neutral-800 px-2 py-0.5 rounded border border-slate-200 dark:border-neutral-700">Shadowing Room</span>
                </div>
                <p className="text-[15px] font-semibold text-slate-800 dark:text-neutral-200 line-clamp-2 leading-relaxed mb-3">{selectedSegmentToReport?.text}</p>
                {(selectedSegmentToReport?.translation_vi || selectedSegmentToReport?.translation) && (
                  <p className="text-[14px] text-slate-500 dark:text-neutral-400 border-t border-slate-200 dark:border-neutral-800 pt-3">
                    {selectedSegmentToReport?.translation_vi || selectedSegmentToReport?.translation}
                  </p>
                )}
              </div>

              {/* Form fields */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-neutral-300 mb-2">Loại lỗi bạn gặp phải là gì? *</label>
                  <select 
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    disabled={isReporting}
                    className="w-full bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow shadow-sm font-medium"
                  >
                    <option value="subtitle_error">Phụ đề tiếng Anh (CC) bị sai</option>
                    <option value="translation_error">Bản dịch tiếng Việt bị sai/lủng củng</option>
                    <option value="timestamp_error">Thời gian (Timestamp) không khớp tiếng</option>
                    <option value="split_error">Ghép câu / Ngắt câu bị sai</option>
                    <option value="missing_sentence">Bị thiếu câu / Mất tiếng</option>
                    <option value="ai_context_error">AI hiểu sai ngữ cảnh</option>
                    <option value="other">Lỗi khác...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-neutral-300 mb-2">Mô tả chi tiết (Tuỳ chọn)</label>
                  <textarea 
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    disabled={isReporting}
                    placeholder="Hãy mô tả lỗi bạn phát hiện để admin dễ xử lý..."
                    className="w-full bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 h-24 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow shadow-sm placeholder:text-slate-400 dark:placeholder:text-neutral-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-neutral-300 mb-2">Gợi ý sửa (Tuỳ chọn)</label>
                  <textarea 
                    value={reportSuggestion}
                    onChange={(e) => setReportSuggestion(e.target.value)}
                    disabled={isReporting}
                    placeholder="Bản dịch đúng hoặc phụ đề đúng theo ý bạn là gì?"
                    className="w-full bg-slate-50 dark:bg-neutral-800/50 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 h-20 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow placeholder:text-slate-400 dark:placeholder:text-neutral-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setShowReportModal(false)} 
                disabled={isReporting}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleReportSubmit} 
                disabled={isReporting}
                className="px-6 py-2.5 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
              >
                <Flag className="w-4 h-4" />
                {isReporting ? "Đang gửi..." : "Gửi Báo Lỗi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
