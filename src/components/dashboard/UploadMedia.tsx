import toast from "react-hot-toast";
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createMediaJob } from "@/app/actions/media";
import { fetchYouTubeCaptions } from "@/app/actions/youtube";
import { Video, Link as LinkIcon, UploadCloud, X, AlertTriangle } from "lucide-react";

export default function UploadMedia({ userId, isPro = false, todayCount = 0, dailyLimit = 10 }: { userId: string, isPro?: boolean, todayCount?: number, dailyLimit?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "youtube">("youtube");
  
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [targetCount, setTargetCount] = useState<number | "">(35);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const limitReached = todayCount >= dailyLimit;
  
  const router = useRouter();
  const supabase = createClient();

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (limitReached) {
      setError(`Bạn đã hết lượt tạo AI hôm nay (${todayCount}/${dailyLimit}). ${!isPro ? 'Hãy nâng cấp Pro để tiếp tục!' : ''}`);
      return;
    }
    
    setUploading(true);
    setError(null);

    try {
      let createdJob = null;

      if (activeTab === 'upload') {
        if (!file) throw new Error("Vui lòng chọn file.");
        
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
        if (!youtubeUrl.includes("youtube.com") && !youtubeUrl.includes("youtu.be")) {
          throw new Error("Link YouTube không hợp lệ.");
        }
        
        const res = await createMediaJob({
          title: "YouTube Video",
          type: "youtube",
          storagePath: "", 
          sizeBytes: 0,
          sourceUrl: youtubeUrl,
          settings: { targetLanguage, targetCount: targetCount || 35 }
        });
        if (res.cached) {
          toast.success("Đã nhân bản từ hệ thống!");
          router.push(`/library/${res.asset.id}`);
          setUploading(false);
          setIsOpen(false);
          return;
        }
        createdJob = res.job;
      }

      setIsOpen(false);
      setFile(null);
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
      setError(err.message || "Đã xảy ra lỗi trong quá trình xử lý.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:bg-indigo-500 hover:-translate-y-0.5 transition-all"
      >
        <Video className="w-4 h-4" />
        New Video
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden dark:bg-[#0a0a0a]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-neutral-800">
              <h3 className="text-xl font-bold text-gray-900">Thêm bài học mới</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex p-1 mb-6 bg-gray-100 rounded-lg dark:bg-neutral-900">
                <button
                  className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'youtube' ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:text-gray-900'} dark:bg-[#0a0a0a]`}
                  onClick={() => setActiveTab('youtube')}
                >
                  <LinkIcon className="w-4 h-4" /> Link YouTube
                </button>
                <button
                  className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'upload' ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:text-gray-900'} dark:bg-[#0a0a0a]`}
                  onClick={() => setActiveTab('upload')}
                >
                  <UploadCloud className="w-4 h-4" /> Tải file lên
                </button>
              </div>

              <form onSubmit={handleProcess} className="space-y-5">
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                    {error}
                  </div>
                )}

                {activeTab === 'youtube' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-neutral-200">Đường dẫn YouTube</label>
                    <input
                      type="url"
                      required
                      className="block w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-sm text-gray-900 border focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors outline-none dark:bg-[#0a0a0a] dark:border-neutral-600"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-neutral-200">File Video / Audio / Subtitle</label>
                    <div className="mt-1 flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10 hover:bg-gray-50 transition-colors dark:border-neutral-600">
                      <div className="text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                        <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center dark:text-neutral-300">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500 dark:bg-[#0a0a0a]"
                          >
                            <span>Tải file lên</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                          </label>
                          <p className="pl-1">hoặc kéo thả</p>
                        </div>
                        <p className="text-xs leading-5 text-gray-500 mt-2 dark:text-neutral-400">MP4, MP3, WAV, M4A, SRT, VTT</p>
                        {file && <p className="text-sm font-medium text-blue-600 mt-2">{file.name}</p>}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-neutral-200">Ngôn ngữ muốn học</label>
                      <select
                        className="block w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-sm text-gray-900 border focus:border-blue-500 focus:ring-blue-500 outline-none dark:bg-[#0a0a0a] dark:border-neutral-600 disabled:opacity-50"
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                      >
                        <option value="English">Tiếng Anh</option>
                        <option value="Chinese">Tiếng Trung</option>
                        <option value="Japanese">Tiếng Nhật</option>
                        <option value="Korean">Tiếng Hàn</option>
                        <option value="French">Tiếng Pháp</option>
                      </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-neutral-200">Số lượng từ vựng</label>
                    {isPro ? (
                      <div className="relative">
                        <input
                          type="number"
                          min={35}
                          max={100}
                          value={targetCount}
                          onChange={(e) => setTargetCount(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="Số từ"
                          className="block w-full h-[46px] rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
                        />
                      </div>
                    ) : (
                      <div className="block w-full h-[46px] rounded-lg border border-gray-300 bg-gray-100 p-3 text-sm text-gray-400 flex items-center justify-between cursor-not-allowed dark:bg-[#0a0a0a] dark:border-neutral-700 dark:text-neutral-500 relative group">
                        <span>35 từ vựng (Free)</span>
                        <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-neutral-900 text-white text-[10px] py-1 px-2 rounded">
                          Lên Pro để nhập số lượng
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">


                  <div className="flex justify-end gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors dark:text-neutral-200 dark:bg-neutral-900"
                      disabled={uploading}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {uploading ? "Đang xử lý..." : "Tiếp tục"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
