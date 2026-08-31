"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle2, RefreshCw } from "lucide-react";

export default function ProcessingStatusClient({ jobId, assetId }: { jobId?: string; assetId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<string>("queued");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!jobId) {
      // Try to fetch job if not provided
      const fetchJob = async () => {
        const { data } = await supabase.from("transcript_jobs").select("*").eq("media_asset_id", assetId).single();
        if (data) {
          setStatus(data.status);
          if (data.error_message) setErrorMsg(data.error_message);
        }
      };
      fetchJob();
    }

    const interval = setInterval(async () => {
      let queryId = jobId;
      if (!queryId) {
        const { data } = await supabase.from("transcript_jobs").select("id").eq("media_asset_id", assetId).single();
        if (data) queryId = data.id;
      }

      if (queryId) {
        const { data, error } = await supabase
          .from("transcript_jobs")
          .select("status, error_message")
          .eq("id", queryId)
          .single();

        if (data) {
          setStatus(data.status);
          if (data.error_message) setErrorMsg(data.error_message);

          // If completed, refresh the page to load the workspace
          if (data.status === "completed") {
            clearInterval(interval);
            router.refresh();
          }
          if (data.status === "failed") {
            clearInterval(interval);
          }
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, assetId, router, supabase]);

  // Determine progress percentage and text
  let progress = 5;
  let text = "Đang xếp hàng chờ xử lý...";
  
  if (status === "extracting_audio") {
    progress = 25;
    text = "Đang tải video và bóc tách âm thanh...";
  } else if (status === "transcribing") {
    progress = 50;
    text = "Đang phân tích và chuyển đổi giọng nói thành văn bản...";
  } else if (status === "analyzing") {
    progress = 80;
    text = "AI đang đọc kịch bản và vắt kiệt từ vựng hay...";
  } else if (status === "completed") {
    progress = 100;
    text = "Hoàn tất! Đang tải giao diện học tập...";
  } else if (status === "failed") {
    progress = 100;
    text = "Xử lý thất bại.";
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-2xl shadow-sm border border-gray-100 text-center dark:bg-[#0a0a0a] dark:border-neutral-800">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Đang xử lý Video</h2>
        <p className="text-gray-500 dark:text-neutral-400">Quá trình này thường mất khoảng 1 - 3 phút.</p>
      </div>

      <div className="relative pt-1 mb-8">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${status === 'failed' ? 'text-red-600 bg-red-100' : 'text-blue-600 bg-blue-100'}`}>
              {status === 'failed' ? 'Lỗi' : 'Tiến độ'}
            </span>
          </div>
          <div className="text-right">
            <span className={`text-xs font-semibold inline-block ${status === 'failed' ? 'text-red-600' : 'text-blue-600'}`}>
              {progress}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100 dark:bg-neutral-900">
          <div style={{ width: `${progress}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${status === 'failed' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 text-gray-700 font-medium dark:text-neutral-200">
        <div className="flex items-center gap-3">
          {status === "failed" ? (
            <div className="text-red-500 flex flex-col items-center">
              <span className="mb-2 text-lg font-bold">❌ Xử lý thất bại</span>
              <span className="text-sm font-normal text-red-400 max-w-md">{errorMsg || "Đã có lỗi xảy ra trong quá trình trích xuất."}</span>
            </div>
          ) : status === "completed" ? (
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          ) : (
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          )}
          {status !== "failed" && <span>{text}</span>}
        </div>

        {status === "failed" && jobId && (
          <button 
            onClick={async () => {
              setIsRetrying(true);
              try {
                await fetch("/api/webhooks/transcription", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ jobId }),
                  keepalive: true
                });
                // Wait for DB to update to queued
                setTimeout(() => {
                  setStatus("queued");
                  setIsRetrying(false);
                }, 1500);
              } catch (e) {
                console.error(e);
                setIsRetrying(false);
              }
            }}
            disabled={isRetrying}
            className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {isRetrying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang khởi động lại...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" /> Thử lại ngay
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
