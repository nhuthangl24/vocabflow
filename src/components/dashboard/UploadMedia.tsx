"use client";
import toast from "react-hot-toast";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createMediaJob } from "@/app/actions/media";
import { Video, Link as LinkIcon, UploadCloud, X, AlertTriangle, PlayCircle, Clock, ListVideo, CheckCircle2, ChevronRight, RefreshCw, Loader2, Play } from "lucide-react";

type VideoItem = {
  id: string;
  title: string;
  duration: number;
  uploader: string;
  thumbnail: string;
  url: string;
  isDuplicate: boolean;
  selected: boolean;
  status: "pending" | "uploading" | "success" | "error";
  errorMsg?: string;
  jobId?: string;
  assetId?: string;
};

export default function UploadMedia({ userId, isPro = false, todayCount = 0, dailyLimit = 10 }: { userId: string, isPro?: boolean, todayCount?: number, dailyLimit?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"input" | "parsing" | "preview" | "uploading">("input");
  const [activeTab, setActiveTab] = useState<"youtube" | "upload">("youtube");
  
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [targetCount, setTargetCount] = useState<number | "">(35);
  const [error, setError] = useState<string | null>(null);
  
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isPlaylist, setIsPlaylist] = useState(false);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [isQueueRunning, setIsQueueRunning] = useState(false);

  const limitReached = todayCount >= dailyLimit;
  const router = useRouter();
  const supabase = createClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Resume Queue Logic
  useEffect(() => {
    if (isOpen && step === "input") {
      const savedQueue = localStorage.getItem(`upload_queue_${userId}`);
      if (savedQueue) {
        try {
          const parsed = JSON.parse(savedQueue);
          if (parsed && parsed.length > 0 && parsed.some((v: any) => v.status !== "success")) {
            if (confirm("Bạn có một tiến trình upload chưa hoàn thành. Bạn có muốn tiếp tục không?")) {
              setVideos(parsed);
              setStep("uploading");
              setIsQueueRunning(false); // require manual resume
            } else {
              localStorage.removeItem(`upload_queue_${userId}`);
            }
          }
        } catch (e) {}
      }
    }
  }, [isOpen, userId, step]);

  const saveQueue = (v: VideoItem[]) => {
    localStorage.setItem(`upload_queue_${userId}`, JSON.stringify(v));
  };

  const handleParseURL = async (e: React.FormEvent) => {
    e.preventDefault();
    if (limitReached) {
      setError(`Bạn đã hết lượt tạo AI hôm nay (${todayCount}/${dailyLimit}). ${!isPro ? 'Hãy nâng cấp Pro để tiếp tục!' : ''}`);
      return;
    }
    
    if (activeTab === 'upload') {
      if (!file) {
        setError("Vui lòng chọn file.");
        return;
      }
      // Direct jump to preview for single file
      setVideos([{
        id: "file_" + Date.now(),
        title: file.name,
        duration: 0,
        uploader: "Local File",
        thumbnail: "",
        url: "",
        isDuplicate: false,
        selected: true,
        status: "pending"
      }]);
      setIsPlaylist(false);
      setStep("preview");
      return;
    }

    if (!youtubeUrl.includes("youtube.com") && !youtubeUrl.includes("youtu.be")) {
      setError("Link YouTube không hợp lệ.");
      return;
    }

    setError(null);
    setStep("parsing");

    try {
      const res = await fetch("/api/youtube/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Không thể phân tích URL này.");

      setIsPlaylist(data.isPlaylist);
      setVideos(data.videos.map((v: any) => ({
        ...v,
        selected: !v.isDuplicate, // Auto unselect duplicates
        status: "pending"
      })));
      setStep("preview");
    } catch (err: any) {
      setError(err.message);
      setStep("input");
    }
  };

  const toggleSelectAll = () => {
    const allSelected = videos.every(v => v.selected);
    setVideos(prev => prev.map(v => ({ ...v, selected: !allSelected })));
  };

  const toggleVideo = (id: string) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, selected: !v.selected } : v));
  };

  const startQueue = () => {
    const toUpload = videos.filter(v => v.selected && v.status !== "success");
    if (toUpload.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 video để xử lý.");
      return;
    }
    setStep("uploading");
    setIsQueueRunning(true);
  };

  // Queue Manager
  useEffect(() => {
    let isCancelled = false;
    
    const processNext = async () => {
      if (!isQueueRunning || isCancelled) return;
      
      const nextIndex = videos.findIndex(v => v.selected && v.status === "pending");
      if (nextIndex === -1) {
        // Find failed items if we are just retrying? No, auto-run only does pending.
        setIsQueueRunning(false);
        const allDone = videos.filter(v => v.selected).every(v => v.status === "success");
        if (allDone) {
          toast.success("Đã hoàn tất toàn bộ danh sách!");
          localStorage.removeItem(`upload_queue_${userId}`);
        }
        return;
      }

      setCurrentUploadIndex(nextIndex);
      const video = videos[nextIndex];
      
      // Mark as uploading
      setVideos(prev => {
        const next = [...prev];
        next[nextIndex].status = "uploading";
        saveQueue(next);
        return next;
      });

      try {
        let createdJob = null;
        
        if (video.id.startsWith("file_") && file) {
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
            settings: { targetLanguage, targetCount: targetCount || 35 }
          });
          createdJob = res.job;
        } else {
          // YouTube
          const res = await createMediaJob({
            title: video.title,
            type: "youtube",
            storagePath: "", 
            sizeBytes: 0,
            sourceUrl: video.url,
            settings: { targetLanguage, targetCount: targetCount || 35 },
            force: video.isDuplicate // Force reprocess if it's a duplicate and user checked it anyway
          });
          createdJob = res.job;
        }

        if (createdJob) {
          // Trigger webhook
          fetch("/api/webhooks/transcription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId: createdJob.id }),
            keepalive: true
          }).catch(e => console.error("Webhook failed:", e));
        }

        // Mark Success
        setVideos(prev => {
          const next = [...prev];
          next[nextIndex] = { ...next[nextIndex], status: "success", jobId: createdJob?.id };
          saveQueue(next);
          return next;
        });

      } catch (err: any) {
        // Mark Error
        setVideos(prev => {
          const next = [...prev];
          next[nextIndex] = { ...next[nextIndex], status: "error", errorMsg: err.message };
          saveQueue(next);
          return next;
        });
        // Stop queue on error so user can decide to retry or skip
        setIsQueueRunning(false);
      }
    };

    processNext();

    return () => { isCancelled = true; };
  }, [isQueueRunning, videos, file, targetLanguage, targetCount, supabase, userId]);

  const handleRetry = (index: number) => {
    setVideos(prev => {
      const next = [...prev];
      next[index].status = "pending";
      next[index].errorMsg = undefined;
      return next;
    });
    setIsQueueRunning(true);
  };

  const handleSkip = (index: number) => {
    setVideos(prev => {
      const next = [...prev];
      next[index].selected = false;
      return next;
    });
    setIsQueueRunning(true);
  };

  const closeAndReset = () => {
    if (isQueueRunning) {
      if (!confirm("Tiến trình đang chạy. Bạn có chắc muốn đóng? Tiến trình sẽ được lưu tạm.")) return;
      setIsQueueRunning(false);
    }
    setIsOpen(false);
    setTimeout(() => {
      setStep("input");
      setVideos([]);
      setYoutubeUrl("");
      setFile(null);
    }, 300);
    router.refresh();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:bg-indigo-500 hover:-translate-y-0.5 transition-all"
      >
        <ListVideo className="w-4 h-4" />
        New Video / Playlist
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl h-[85vh] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-neutral-800 shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <ListVideo className="w-6 h-6 text-indigo-500" />
                Thêm bài học mới (Hỗ trợ Playlist)
              </h3>
              <button onClick={closeAndReset} className="text-gray-400 hover:text-gray-600 dark:text-neutral-400 p-2 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50 dark:bg-[#050505]">
              {step === "input" && (
                <div className="flex-1 p-6 md:p-12 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
                  <div className="flex p-1 mb-8 bg-gray-100 rounded-xl dark:bg-neutral-900 w-full shadow-inner">
                    <button
                      className={`flex-1 flex justify-center items-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'youtube' ? 'bg-white text-indigo-700 shadow-sm dark:bg-[#1a1a1a] dark:text-indigo-400' : 'text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white'}`}
                      onClick={() => setActiveTab('youtube')}
                    >
                      <LinkIcon className="w-4 h-4" /> Link YouTube / Playlist
                    </button>
                    <button
                      className={`flex-1 flex justify-center items-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'upload' ? 'bg-white text-indigo-700 shadow-sm dark:bg-[#1a1a1a] dark:text-indigo-400' : 'text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white'}`}
                      onClick={() => setActiveTab('upload')}
                    >
                      <UploadCloud className="w-4 h-4" /> Tải file lên
                    </button>
                  </div>

                  <form onSubmit={handleParseURL} className="w-full space-y-6">
                    {error && (
                      <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
                      </div>
                    )}

                    {activeTab === 'youtube' ? (
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700 dark:text-neutral-200">Đường dẫn YouTube</label>
                        <input
                          type="url"
                          required
                          className="block w-full rounded-xl border-gray-300 bg-white p-4 text-base text-gray-900 border-2 focus:border-indigo-500 focus:ring-0 transition-colors outline-none dark:bg-[#0a0a0a] dark:border-neutral-700 shadow-sm dark:text-white"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          placeholder="Dán link Video hoặc Playlist..."
                        />
                        <p className="text-sm text-slate-500 dark:text-neutral-500 font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Hệ thống tự động phân tích Playlist.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="mt-1 flex justify-center rounded-2xl border-2 border-dashed border-gray-300 px-6 py-16 hover:bg-indigo-50/50 transition-colors dark:border-neutral-700 dark:hover:bg-indigo-900/10 cursor-pointer bg-white dark:bg-[#0a0a0a]">
                          <div className="text-center">
                            <UploadCloud className="mx-auto h-16 w-16 text-indigo-300 dark:text-indigo-500/50" />
                            <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center dark:text-neutral-300">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                              >
                                <span>Bấm để tải file lên</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                              </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 font-medium dark:text-neutral-500">MP4, MP3, WAV, M4A, SRT, VTT</p>
                            {file && <p className="text-sm font-bold text-indigo-600 mt-4 bg-indigo-50 dark:bg-indigo-500/10 inline-block px-4 py-2 rounded-lg">{file.name}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Phân tích & Tiếp tục <ChevronRight className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              )}

              {step === "parsing" && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-20 h-20 mb-6 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Đang phân tích Playlist...</h3>
                  <p className="text-slate-500 dark:text-neutral-400 font-medium">Hệ thống đang trích xuất danh sách video, vui lòng đợi trong giây lát.</p>
                </div>
              )}

              {(step === "preview" || step === "uploading") && (
                <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
                  {/* Left sidebar: Settings */}
                  <div className="w-full lg:w-80 bg-white dark:bg-[#0a0a0a] border-r border-slate-200 dark:border-neutral-800 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 z-10 shadow-sm lg:shadow-none">
                    <div>
                      <h4 className="text-sm font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-4">Cài đặt chung</h4>
                      
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-neutral-300 mb-2">Ngôn ngữ đích</label>
                          <select
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
                            value={targetLanguage}
                            onChange={(e) => setTargetLanguage(e.target.value)}
                            disabled={step === "uploading"}
                          >
                            <option value="English">Tiếng Anh</option>
                            <option value="Chinese">Tiếng Trung</option>
                            <option value="Japanese">Tiếng Nhật</option>
                            <option value="Korean">Tiếng Hàn</option>
                            <option value="French">Tiếng Pháp</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-neutral-300 mb-2">Số lượng từ vựng AI bóc tách</label>
                          {isPro ? (
                            <input
                              type="number"
                              min={35}
                              max={100}
                              value={targetCount}
                              onChange={(e) => setTargetCount(e.target.value === "" ? "" : Number(e.target.value))}
                              disabled={step === "uploading"}
                              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
                            />
                          ) : (
                            <div className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-sm font-medium text-slate-400 cursor-not-allowed dark:bg-neutral-900 dark:border-neutral-800">
                              35 từ vựng (Gói Free)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-200 dark:border-neutral-800">
                      <div className="flex items-center justify-between text-sm font-bold mb-4">
                        <span className="text-slate-600 dark:text-neutral-400">Đã chọn:</span>
                        <span className="text-indigo-600 dark:text-indigo-400 text-xl">{videos.filter(v => v.selected).length} <span className="text-sm font-medium text-slate-500">/{videos.length}</span></span>
                      </div>
                      
                      {step === "preview" ? (
                        <button
                          onClick={startQueue}
                          className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                        >
                          <Play className="w-5 h-5 fill-current" /> Bắt đầu xử lý
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsQueueRunning(!isQueueRunning)}
                          className={`w-full rounded-xl px-6 py-4 text-base font-bold shadow-lg transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 ${isQueueRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                        >
                          {isQueueRunning ? <><Clock className="w-5 h-5" /> Tạm dừng</> : <><Play className="w-5 h-5 fill-current" /> Tiếp tục</>}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right side: Video List */}
                  <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#050505]">
                    <div className="p-4 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a] flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-4">
                        {step === "preview" && (
                          <button onClick={toggleSelectAll} className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            {videos.every(v => v.selected) ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                          </button>
                        )}
                        <h2 className="font-bold text-slate-900 dark:text-white">Danh sách Video {isPlaylist && "(Playlist)"}</h2>
                      </div>
                      {step === "uploading" && (
                        <div className="text-sm font-bold text-slate-500">
                          Tiến độ: {videos.filter(v => v.status === "success").length} / {videos.filter(v => v.selected).length}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
                      {videos.map((v, i) => (
                        <div key={v.id} className={`flex items-center p-3 md:p-4 rounded-xl border transition-all ${!v.selected ? 'opacity-50 grayscale bg-slate-50 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800' : v.status === 'uploading' ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm' : v.status === 'error' ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : v.status === 'success' ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10' : 'bg-white dark:bg-[#0a0a0a] border-slate-200 dark:border-neutral-800 hover:border-indigo-300 cursor-pointer'}`} onClick={() => step === "preview" && toggleVideo(v.id)}>
                          
                          {/* Checkbox or Status Icon */}
                          <div className="w-10 flex shrink-0 justify-center">
                            {step === "preview" ? (
                              <input type="checkbox" checked={v.selected} onChange={() => {}} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                            ) : (
                              v.status === "uploading" ? <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" /> :
                              v.status === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> :
                              v.status === "error" ? <AlertTriangle className="w-5 h-5 text-red-500" /> :
                              <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-neutral-700"></div>
                            )}
                          </div>

                          {/* Thumbnail */}
                          {v.thumbnail && (
                            <div className="w-24 h-16 bg-slate-200 dark:bg-neutral-800 rounded-lg overflow-hidden shrink-0 mx-3 relative">
                              <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                              <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 font-mono rounded">{formatTime(v.duration)}</div>
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0 pr-4">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate" title={v.title}>{v.title}</h4>
                            <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1 flex items-center gap-3">
                              <span className="truncate">{v.uploader}</span>
                              {v.isDuplicate && (
                                <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded font-bold text-[10px] uppercase">Đã tồn tại</span>
                              )}
                            </div>
                            
                            {v.status === "error" && (
                              <div className="text-xs font-bold text-red-500 mt-2 bg-red-100 dark:bg-red-500/10 p-2 rounded-lg break-words">
                                Lỗi: {v.errorMsg}
                              </div>
                            )}
                          </div>

                          {/* Retry Actions */}
                          {v.status === "error" && (
                            <div className="flex flex-col gap-2 shrink-0">
                              <button onClick={(e) => { e.stopPropagation(); handleRetry(i); }} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors">Thử lại</button>
                              <button onClick={(e) => { e.stopPropagation(); handleSkip(i); }} className="px-3 py-1.5 bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300 text-xs font-bold rounded-lg hover:bg-slate-300 transition-colors">Bỏ qua</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
