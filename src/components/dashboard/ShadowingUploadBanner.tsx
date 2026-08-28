"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createMediaJob } from "@/app/actions/media";
import { Video, LinkIcon, Upload, Sparkles, Clipboard } from "lucide-react";

export default function ShadowingUploadBanner({ 
  userId
}: { 
  userId: string
}) {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'youtube' | 'upload'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId) {
      router.push('/login');
      return;
    }

    setUploading(true);

    try {
      if (activeTab === 'youtube') {
        if (!youtubeUrl.includes("youtube.com") && !youtubeUrl.includes("youtu.be")) {
          throw new Error("Invalid YouTube link.");
        }
        
        await createMediaJob({
          title: "YouTube Video",
          type: "youtube",
          storagePath: "", 
          sizeBytes: 0,
          sourceUrl: youtubeUrl,
          settings: { targetLanguage, module: 'shadowing' },
          module: 'shadowing'
        });
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

        await createMediaJob({
          title: file.name,
          type,
          storagePath: uploadData.path,
          sizeBytes: file.size,
          settings: { targetLanguage, module: 'shadowing' },
          module: 'shadowing'
        });
      }

      setYoutubeUrl("");
      router.refresh();

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
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Thêm video mới vào Phòng luyện.</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
            Dán link YouTube vào đây để AI xử lý phụ đề và tạo bài tập chép chính tả / shadowing cho bạn.
          </p>
        </div>

        {/* Input Section */}
        <div className="w-full z-10 bg-slate-50/50 dark:bg-[#0a0a0a]/50 rounded-xl border border-slate-100 dark:border-neutral-800 p-2 shadow-inner relative">
          
          {/* Limit Reached Banner - Removed for Shadowing */}<form onSubmit={handleProcess} className={`flex flex-col gap-2`}>
            
            {/* Tabs */}
            <div className="flex items-center gap-1 px-1 pt-1 pb-2">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-white dark:bg-neutral-900 text-indigo-600 dark:text-neutral-200 shadow-sm border border-slate-200 dark:border-neutral-700"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                YouTube Link
              </button>
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
                  className="h-11 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 text-sm font-medium text-slate-700 dark:text-neutral-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm flex-1 sm:w-32 sm:flex-none dark:text-neutral-200"
                >
                  <option value="English">Tiếng Anh</option>
                  <option value="Chinese">Tiếng Trung</option>
                  <option value="Japanese">Tiếng Nhật</option>
                  <option value="Korean">Tiếng Hàn</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="h-11 px-6 bg-neutral-900 text-white font-bold text-sm rounded-lg hover:bg-neutral-800 transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
              >
                {uploading && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                )}
                {uploading ? "Đang xử lý..." : "Tạo bài luyện"}
              </button>
            </div>
            
            {error && (
              <p className="text-xs font-medium text-rose-500 mt-1 px-1">{error}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
