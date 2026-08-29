"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createMediaJob } from "@/app/actions/media";
import { fetchYouTubeCaptions } from "@/app/actions/youtube";
import { Video, LinkIcon, Upload, Sparkles, Clipboard, AlertTriangle } from "lucide-react";

export default function InlineUploadBanner({ 
  userId, 
  isPro = false,
  todayCount = 0,
  dailyLimit = 2,
  module = 'vocabulary'
}: { 
  userId: string, 
  isPro?: boolean,
  todayCount?: number,
  dailyLimit?: number,
  module?: 'vocabulary' | 'shadowing'
}) {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'youtube' | 'upload'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [targetCount, setTargetCount] = useState<number | "">(35);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  
  // Caption state
  const [isFetchingCaptions, setIsFetchingCaptions] = useState(false);
  const [availableCaptions, setAvailableCaptions] = useState<{name: string, languageCode: string}[] | null>(null);
  const [hasManualCaptions, setHasManualCaptions] = useState<boolean | null>(null);
  const [acceptWarning, setAcceptWarning] = useState(false);

  const limitReached = todayCount >= dailyLimit;

  // Auto-fetch captions when URL changes (only for shadowing)
  useEffect(() => {
    let isMounted = true;
    const url = youtubeUrl.trim();
    
    if (module === 'shadowing' && activeTab === 'youtube' && url.length > 10) {
      const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (videoIdMatch) {
        setIsFetchingCaptions(true);
        setAvailableCaptions(null);
        setHasManualCaptions(null);
        setAcceptWarning(false);
        
        fetchYouTubeCaptions(url).then(res => {
          if (!isMounted) return;
          setIsFetchingCaptions(false);
          if (res.success) {
            setHasManualCaptions(res.hasManualCaptions ?? false);
            setAvailableCaptions(res.tracks || []);
            // Auto-select the first available language if it exists
            if (res.tracks && res.tracks.length > 0) {
              setTargetLanguage(res.tracks[0].name);
            }
          }
        }).catch(() => {
          if (isMounted) setIsFetchingCaptions(false);
        });
      } else {
        setAvailableCaptions(null);
        setHasManualCaptions(null);
      }
    } else {
      setAvailableCaptions(null);
      setHasManualCaptions(null);
    }
    
    return () => { isMounted = false; };
  }, [youtubeUrl, activeTab]);

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId) {
      router.push('/login');
      return;
    }

    if (limitReached) {
      if (dailyLimit === 0) {
        setError(`Tính năng này chỉ dành cho tài khoản Basic & Pro. Hãy nâng cấp để sử dụng!`);
      } else {
        setError(`Bạn đã hết lượt tạo AI hôm nay (${todayCount}/${dailyLimit}). ${!isPro ? 'Hãy nâng cấp Pro để tiếp tục!' : ''}`);
      }
      return;
    }
    
    if (module === 'shadowing' && activeTab === 'youtube' && hasManualCaptions === false && !acceptWarning) {
      setError("Vui lòng xác nhận đồng ý tiếp tục dù video không có phụ đề chuẩn.");
      return;
    }

    setUploading(true);

    try {
      let createdJob = null;

      if (activeTab === 'youtube') {
        if (!youtubeUrl.includes("youtube.com") && !youtubeUrl.includes("youtu.be")) {
          throw new Error("Invalid YouTube link.");
        }
        
        const res = await createMediaJob({
          title: "YouTube Video",
          type: "youtube",
          storagePath: "", 
          sizeBytes: 0,
          sourceUrl: youtubeUrl,
          settings: { targetLanguage, targetCount: targetCount || 35, module },
          module: module
        });
        createdJob = res.job;
      } else {
        // Fallback for upload via hidden file input (handled by standard click)
        const fileInput = document.getElementById('inline-file-upload') as HTMLInputElement;
        const file = fileInput?.files?.[0];
        
        if (!file) throw new Error("Please select a file.");

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        let type = "video";
        if (file.type.startsWith("audio/")) type = "audio";
        if (file.name.endsWith(".srt") || file.name.endsWith(".vtt")) type = "subtitle";

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const res = await createMediaJob({
          title: file.name,
          type,
          storagePath: uploadData.path,
          sizeBytes: file.size,
          settings: { targetLanguage, targetCount: targetCount || 35, module },
          module: module
        });
        createdJob = res.job;
      }

      setYoutubeUrl("");
      router.refresh();

      // Trigger processing in the background non-blockingly
      if (createdJob) {
        fetch("/api/webhooks/transcription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: createdJob.id })
        }).catch(e => console.error("Webhook failed:", e));
      }

    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden mb-8 dark:border-neutral-700">
      
      <div className="p-5 md:p-6 flex flex-col gap-4 relative overflow-hidden">
        
        {/* Background Decorative Icon */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Text Section */}
        <div className="z-10 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Biến mọi video yêu thích thành bài học.</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
            Học ngoại ngữ qua bất kỳ video YouTube nào bạn muốn. Hệ thống sẽ tự động tạo phụ đề, từ vựng và bài tập.
          </p>
        </div>

        {/* Input Section */}
        <div className="w-full z-10 bg-slate-50/50 dark:bg-[#0a0a0a]/50 rounded-xl border border-slate-100 dark:border-neutral-800 p-2 shadow-inner relative">
          
          {limitReached && (
            <div className="absolute inset-0 bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-xl border border-rose-200 dark:border-rose-900/50">
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                {dailyLimit === 0 ? "Tính năng dành riêng cho tài khoản Basic & Pro" : "Đã hết lượt xử lý AI hôm nay"}
              </p>
              <Link href="/pricing" className="text-xs font-bold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                Nâng cấp tài khoản ngay
              </Link>
            </div>
          )}

          <form onSubmit={handleProcess} className={`flex flex-col gap-2 ${limitReached ? 'opacity-50 pointer-events-none' : ''}`}>
            
            {/* Tabs */}
            <div className="flex items-center justify-between px-1 pt-1 pb-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-white dark:bg-neutral-900 text-indigo-600 dark:text-neutral-200 shadow-sm border border-slate-200 dark:border-neutral-700"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  YouTube Link
                </button>
              </div>
              
              {/* Usage Count Display */}
              {dailyLimit > 0 && dailyLimit < 999999 && (
                <div className="text-xs font-medium text-slate-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 shadow-sm">
                  Lượt dùng: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{todayCount}</span> / {dailyLimit}
                </div>
              )}
            </div>

            {/* Main Input Row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <input
                  type="url"
                  required
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Dán link YouTube vào đây..."
                  className="w-full h-11 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg pl-4 pr-10 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setYoutubeUrl(text);
                    } catch (err) {
                      console.error('Failed to read clipboard contents: ', err);
                    }
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                  title="Dán link"
                >
                  <Clipboard className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  disabled={isFetchingCaptions}
                  className="h-11 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 text-sm font-medium text-slate-700 dark:text-neutral-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm flex-1 sm:w-32 sm:flex-none dark:text-neutral-200 disabled:opacity-50"
                >
                  {isFetchingCaptions ? (
                    <option>Đang tìm CC...</option>
                  ) : availableCaptions && availableCaptions.length > 0 ? (
                    availableCaptions.map((cap, idx) => (
                      <option key={idx} value={cap.name}>{cap.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="English">Tiếng Anh</option>
                      <option value="Chinese">Tiếng Trung</option>
                      <option value="Japanese">Tiếng Nhật</option>
                      <option value="Korean">Tiếng Hàn</option>
                    </>
                  )}
                </select>

                {module === 'vocabulary' && (
                  <>
                    {isPro ? (
                      <div className="relative">
                        <input 
                          type="number" 
                          placeholder="35 từ vựng" 
                          min="5"
                          max="100"
                          value={targetCount}
                          onChange={(e) => setTargetCount(e.target.value === "" ? "" : Number(e.target.value))}
                          className="h-11 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 text-sm font-medium text-slate-700 dark:text-neutral-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm w-full sm:w-32 dark:text-neutral-200"
                          disabled={uploading}
                        />
                      </div>
                    ) : (
                      <div className="h-11 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 text-sm font-medium text-slate-400 dark:text-neutral-500 flex items-center justify-center sm:justify-start shadow-sm flex-1 sm:w-32 sm:flex-none cursor-not-allowed relative group dark:text-neutral-400 dark:bg-[#0a0a0a]">
                        <span>35 từ vựng</span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs p-2 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-center z-10 pointer-events-none">
                          Nâng cấp PRO để tuỳ chỉnh số lượng từ vựng
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={uploading || isFetchingCaptions || (module === 'shadowing' && hasManualCaptions === false && !acceptWarning)}
                className="h-11 px-6 bg-neutral-900 text-white font-bold text-sm rounded-lg hover:bg-neutral-800 transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
              >
                {uploading && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                )}
                {uploading ? "Đang xử lý..." : "Tạo bài học"}
              </button>
            </div>
            
            {/* Missing CC Warning */}
            {module === 'shadowing' && activeTab === 'youtube' && hasManualCaptions === false && !isFetchingCaptions && (
              <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-3 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm text-amber-800 dark:text-amber-300 font-medium leading-snug">
                    Video này không có phụ đề chuẩn do con người tạo (CC). Hệ thống sẽ sử dụng AI để tự tạo phụ đề nên độ chính xác có thể không cao.
                  </p>
                  <label className="flex items-start gap-2 cursor-pointer group mt-1">
                    <input 
                      type="checkbox" 
                      checked={acceptWarning}
                      onChange={(e) => setAcceptWarning(e.target.checked)}
                      className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer bg-white"
                    />
                    <span className="text-sm font-bold text-amber-900 dark:text-amber-400 group-hover:text-amber-700 transition-colors">
                      Tôi đồng ý tiếp tục dù độ chính xác có thể thấp
                    </span>
                  </label>
                </div>
              </div>
            )}
            
            {error && (
              <p className="text-xs font-medium text-rose-500 mt-1 px-1">{error}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
