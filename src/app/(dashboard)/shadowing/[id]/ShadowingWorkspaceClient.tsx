"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
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

export default function ShadowingWorkspaceClient({ videoUrl, transcript = [] }: { videoUrl: string, transcript: any[] }) {
  const [player, setPlayer] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // UI states
  const [activeTab, setActiveTab] = useState<"dictation" | "shadowing">("dictation");
  const [hideVideo, setHideVideo] = useState(false);
  
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

  useEffect(() => {
    let interval: any;
    if (isPlaying && player && videoId) {
      interval = setInterval(async () => {
        try {
          const time = await player.getCurrentTime();
          setCurrentTime(time);
          if (!duration) setDuration(await player.getDuration());
          
          if (activeTab === "dictation" && currentSegment) {
            const endTime = currentSegment.end_time_ms / 1000;
            if (time >= endTime) {
              player.pauseVideo();
              setIsPlaying(false);
              player.seekTo(endTime - 0.05, true);
              setCurrentTime(endTime - 0.05);
            }
          }
        } catch (e) {}
      }, 100);
    } else if (isPlaying && videoRef.current && !videoId) {
      interval = setInterval(() => {
        const time = videoRef.current!.currentTime;
        setCurrentTime(time);
        if (!duration && videoRef.current!.duration) setDuration(videoRef.current!.duration);

        if (activeTab === "dictation" && currentSegment) {
          const endTime = currentSegment.end_time_ms / 1000;
          if (time >= endTime) {
            videoRef.current!.pause();
            setIsPlaying(false);
            videoRef.current!.currentTime = endTime - 0.05;
            setCurrentTime(endTime - 0.05);
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
      const seekTime = transcript[index].start_time_ms / 1000;
      setCurrentTime(seekTime);
      performSeek(seekTime);
    }
  };

  const handleReplay = () => {
    if (currentSegment) {
      performSeek(currentSegment.start_time_ms / 1000);
    }
  };

  const handleTogglePlayPause = () => {
    if (isPlaying) {
      if (player && videoId) player.pauseVideo();
      else if (videoRef.current) videoRef.current!.pause();
      setIsPlaying(false);
    } else {
      if (player && videoId) player.playVideo();
      else if (videoRef.current) videoRef.current!.play();
      setIsPlaying(true);
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
    
    // Strict check: keep punctuation, only remove extra whitespace and ignore case
    const normalize = (str: string) => str.replace(/\s+/g, '').toLowerCase();
    
    const originalClean = normalize(currentSegment.text);
    const inputClean = normalize(dictations[currentIndex] || "");
    
    if (originalClean === inputClean && originalClean.length > 0) {
      setCheckResult({ ...checkResult, [currentIndex]: true });
      setDiffResult({ ...diffResult, [currentIndex]: computeDiff(currentSegment.text, dictations[currentIndex] || "") });
      
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
            // Slim Audio Player UI (overlay controls when video is hidden)
            <div className="w-full bg-[#1e1e1e] border border-neutral-800 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
              <button 
                onClick={handleTogglePlayPause}
                className="w-12 h-12 shrink-0 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center text-white transition-colors shadow-lg shadow-indigo-600/20"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </button>
              
              <div className="text-sm font-bold text-neutral-300 shrink-0 w-24 text-center tracking-wide">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              
              <div className="flex-1 flex items-center">
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
                  className="w-full h-2 bg-neutral-700 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                />
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
        </div>
      </div>

      <div className="w-full lg:w-6/12">
        <div className={`w-full bg-white dark:bg-[#121212] rounded-3xl shadow-lg border border-slate-200 dark:border-neutral-800 p-6 flex flex-col ${
          activeTab === "shadowing" 
            ? "h-[calc(100vh-14rem)]" 
            : ""
        }`}>
          
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
                          
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-2 mb-3">
                              {segment.text.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9À-ỹ]+|[^a-zA-Z0-9À-ỹ\u4e00-\u9fa5]+/g)?.map((token: string, i: number) => {
                                const isSpaceOrPunct = /[^a-zA-Z0-9À-ỹ\u4e00-\u9fa5]/.test(token);
                                if (isSpaceOrPunct && token.trim() === '') return null; // skip extra spaces
                                if (isSpaceOrPunct) return <span key={i} className="text-slate-400 dark:text-neutral-500 self-center font-bold">{token}</span>;
                                
                                return (
                                  <div key={i} className={`px-2.5 py-1.5 rounded-lg border ${
                                    isActive 
                                      ? 'border-indigo-300 dark:border-indigo-500/40 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-white shadow-sm' 
                                      : 'border-slate-200 dark:border-neutral-700 bg-transparent text-slate-500 dark:text-neutral-400'
                                  } font-semibold text-lg leading-none flex items-center justify-center`}>
                                    {token}
                                  </div>
                                );
                              })}
                            </div>
                            
                            {(segment.translation_vi || segment.translation) && (
                              <p className={`text-sm leading-relaxed mt-4 pt-4 border-t ${isActive ? 'text-indigo-600 dark:text-indigo-200/70 border-indigo-200 dark:border-indigo-500/20' : 'text-slate-500 dark:text-neutral-500 border-slate-200 dark:border-neutral-800'}`}>
                                {segment.translation_vi || segment.translation}
                              </p>
                            )}
                          </div>
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
    </div>
  );
}
