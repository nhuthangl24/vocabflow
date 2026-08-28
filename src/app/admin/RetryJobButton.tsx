"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function RetryJobButton({ jobId }: { jobId: string }) {
  const [retrying, setRetrying] = useState(false);
  const router = useRouter();

  const handleRetry = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (retrying) return;
    setRetrying(true);

    try {
      await fetch("/api/webhooks/transcription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId })
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setRetrying(false), 2000);
    }
  };

  return (
    <button 
      onClick={handleRetry}
      disabled={retrying}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${retrying ? 'text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:text-neutral-500 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20'}`}
      title="Thử lại"
    >
      <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
    </button>
  );
}
