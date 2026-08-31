import { useEffect, useState } from "react";
import { getUserActivity } from "../actions";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Activity, TerminalSquare, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ActivityTab({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserActivity(userId).then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return <div className="py-20 text-center text-neutral-500 text-sm">Đang tải lịch sử hoạt động...</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-neutral-500 gap-3">
        <Activity className="w-10 h-10 opacity-20" />
        <p>Không có hoạt động nào được ghi nhận.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Activity Timeline</h2>
      
      <div className="relative border-l border-neutral-800 ml-4 space-y-6">
        {logs.map((log) => {
          const isError = log.status === 'error' || log.status === 'failed';
          return (
            <div key={log.id} className="relative pl-6">
              <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${isError ? 'bg-red-500' : 'bg-indigo-500'}`} />
              
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white text-sm capitalize">{log.action.replace(/_/g, ' ')}</span>
                <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                  • {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: vi })}
                </span>
              </div>
              
              <div className="text-xs text-neutral-400 max-w-2xl bg-neutral-900/50 p-3 rounded-lg border border-neutral-800 mt-2">
                <div className="flex gap-4 mb-2">
                  <div className="flex items-center gap-1.5"><TerminalSquare className="w-3.5 h-3.5 text-neutral-500" /> <span className="text-neutral-300">IP:</span> {log.ip_address || "Unknown"}</div>
                  <div className="flex items-center gap-1.5"><TerminalSquare className="w-3.5 h-3.5 text-neutral-500" /> <span className="text-neutral-300">Thiết bị:</span> {log.device || "Unknown"}</div>
                  <div className="flex items-center gap-1.5">
                    {isError ? <AlertCircle className="w-3.5 h-3.5 text-red-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    <span className={isError ? "text-red-400" : "text-emerald-400"}>{log.status || "success"}</span>
                  </div>
                </div>
                {log.details && Object.keys(log.details).length > 0 && (
                  <pre className="text-[10px] bg-black p-2 rounded border border-neutral-800 mt-2 overflow-x-auto text-neutral-400 font-mono">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
