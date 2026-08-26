"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createMediaJob } from "@/app/actions/media";
import { Video, LinkIcon, Upload, Sparkles } from "lucide-react";

export default function InlineUploadBanner({ userId }: { userId: string }) {
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
          settings: { targetLanguage }
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
          settings: { targetLanguage }
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Decorative top border or subtle gradient accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
      
      <div className="p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
        
        {/* Background Decorative Icon */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Text Section */}
        <div className="z-10 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">Biến mọi video yêu thích thành bài học.</h2>
          <p className="text-sm font-medium text-slate-500">
            Học ngoại ngữ qua bất kỳ video YouTube nào bạn muốn. Hệ thống sẽ tự động tạo phụ đề, từ vựng và bài tập.
          </p>
        </div>

        {/* Input Section */}
        <div className="w-full z-10 bg-slate-50/50 rounded-xl border border-slate-100 p-2 shadow-inner">
          <form onSubmit={handleProcess} className="flex flex-col gap-2">
            
            {/* Tabs */}
            <div className="flex items-center gap-1 px-1 pt-1 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('youtube')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'youtube' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                YouTube Link
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'upload' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Tải video lên
              </button>
            </div>

            {/* Main Input Row */}
            <div className="flex flex-col sm:flex-row gap-2">
              {activeTab === 'youtube' ? (
                <input
                  type="url"
                  required
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Dán link YouTube vào đây..."
                  className="flex-1 h-11 bg-white border border-slate-200 rounded-lg px-4 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
              ) : (
                <div className="flex-1 relative">
                  <input 
                    id="inline-file-upload" 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    onChange={() => {
                      const fileInput = document.getElementById('inline-file-upload') as HTMLInputElement;
                      if (fileInput.files?.[0]) {
                        // Just a dummy trigger
                      }
                    }}
                  />
                  <div className="h-11 bg-white border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm">
                    Click để chọn hoặc kéo thả file
                  </div>
                </div>
              )}

              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="h-11 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm w-full sm:w-32"
              >
                <option value="English">Tiếng Anh</option>
                <option value="Chinese">Tiếng Trung</option>
                <option value="Japanese">Tiếng Nhật</option>
                <option value="Korean">Tiếng Hàn</option>
              </select>

              <button
                type="submit"
                disabled={uploading}
                className="h-11 px-6 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
              >
                {uploading && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                )}
                {uploading ? "Đang xử lý..." : "Tạo bài học"}
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
