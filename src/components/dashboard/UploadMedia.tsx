"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createMediaJob } from "@/app/actions/media";
import { Video, Link as LinkIcon, UploadCloud, X } from "lucide-react";

export default function UploadMedia({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "youtube">("youtube");
  
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);

    try {
      if (activeTab === "upload") {
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

        await createMediaJob({
          title: file.name,
          type,
          storagePath: uploadData.path,
          sizeBytes: file.size,
          settings: { targetLanguage }
        });

      } else {
        // YouTube Logic
        if (!youtubeUrl.includes("youtube.com") && !youtubeUrl.includes("youtu.be")) {
          throw new Error("Link YouTube không hợp lệ.");
        }
        
        // Placeholder for YouTube processing. In a real app, backend uses ytdl-core to download audio.
        await createMediaJob({
          title: "YouTube Video",
          type: "youtube",
          storagePath: "", 
          sizeBytes: 0,
          sourceUrl: youtubeUrl,
          settings: { targetLanguage }
        });
      }

      setIsOpen(false);
      setFile(null);
      setYoutubeUrl("");
      router.refresh();

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
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Thêm bài học mới</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Tabs */}
              <div className="flex p-1 mb-6 bg-gray-100 rounded-lg">
                <button
                  className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'youtube' ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:text-gray-900'}`}
                  onClick={() => setActiveTab('youtube')}
                >
                  <LinkIcon className="w-4 h-4" /> Link YouTube
                </button>
                <button
                  className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'upload' ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:text-gray-900'}`}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đường dẫn YouTube</label>
                    <input
                      type="url"
                      required
                      className="block w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-sm text-gray-900 border focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors outline-none"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">File Video / Audio / Subtitle</label>
                    <div className="mt-1 flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10 hover:bg-gray-50 transition-colors">
                      <div className="text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                        <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                          >
                            <span>Tải file lên</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                          </label>
                          <p className="pl-1">hoặc kéo thả</p>
                        </div>
                        <p className="text-xs leading-5 text-gray-500 mt-2">MP4, MP3, WAV, M4A, SRT, VTT</p>
                        {file && <p className="text-sm font-medium text-blue-600 mt-2">{file.name}</p>}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ muốn học</label>
                  <select
                    className="block w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-sm text-gray-900 border focus:border-blue-500 focus:ring-blue-500 outline-none"
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

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                    disabled={uploading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    disabled={uploading || (activeTab === 'upload' && !file) || (activeTab === 'youtube' && !youtubeUrl)}
                  >
                    {uploading ? "Đang xử lý..." : "Tiếp tục"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
