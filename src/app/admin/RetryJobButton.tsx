"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/admin/ui";

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
    <Button 
      variant="ghost" 
      size="sm"
      onClick={handleRetry}
      disabled={retrying}
      title="Thử lại"
      className="p-1.5 h-8 w-8 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
    >
      <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
    </Button>
  );
}
