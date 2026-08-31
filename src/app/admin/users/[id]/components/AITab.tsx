import { useEffect, useState } from "react";
import { getUserAILogs } from "../actions";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Cpu, Zap, CreditCard, Activity, Clock, Terminal } from "lucide-react";

export default function AITab({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserAILogs(userId).then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return <div className="py-20 text-center text-neutral-500 text-sm">Đang tải lịch sử AI...</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-neutral-500 gap-3">
        <Cpu className="w-10 h-10 opacity-20" />
        <p>Không có lịch sử sử dụng AI nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">AI Usage History</h2>
        <span className="text-xs text-neutral-500">{logs.length} request gần nhất</span>
      </div>
      
      <div className="bg-neutral-900/30 rounded-xl border border-neutral-800/60 overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="text-[10px] text-neutral-500 bg-neutral-900/40 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">Thời gian</th>
                <th className="px-4 py-3 font-medium">Provider / Model</th>
                <th className="px-4 py-3 font-medium">Module</th>
                <th className="px-4 py-3 font-medium text-right">Tokens (In/Out)</th>
                <th className="px-4 py-3 font-medium text-right">Cost / Latency</th>
                <th className="px-4 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-xs">
              {logs.map((log) => {
                const isError = log.status === 'error' || log.status === 'failed';
                return (
                  <tr key={log.id} className="hover:bg-neutral-900/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-300">
                      <div>{new Date(log.created_at).toLocaleDateString('vi-VN')}</div>
                      <div className="text-[10px] text-neutral-500">{new Date(log.created_at).toLocaleTimeString('vi-VN')}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-indigo-400 font-medium capitalize">{log.provider}</div>
                      <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{log.model}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[10px] uppercase tracking-wider">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-amber-400 font-medium">{(log.total_tokens || 0).toLocaleString()} <span className="text-neutral-500 text-[10px]">Total</span></div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {log.prompt_tokens || 0} in / {log.completion_tokens || 0} out
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-emerald-400 font-medium">
                        {(log.estimated_cost_usd || 0) > 0 ? `$${Number(log.estimated_cost_usd).toFixed(4)}` : "Free"}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" /> {log.latency_ms ? `${log.latency_ms}ms` : '--'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isError ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {log.status || 'success'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
