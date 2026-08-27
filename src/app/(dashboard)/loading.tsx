import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-[400px] text-slate-400 dark:text-neutral-400">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
      <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">Đang tải dữ liệu...</p>
    </div>
  );
}
