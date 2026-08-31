"use client";

import { useState, useEffect } from "react";
import { History, Globe, Monitor, LogIn, Upload, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

type Log = {
  id: string;
  action: string;
  ip_address: string;
  device: string;
  browser: string;
  status: string;
  created_at: string;
};

export default function ActivityClient() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/activity");
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      } else {
        toast.error(data.error || "Failed to load activity logs");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionIcon = (action: string) => {
    if (action.toLowerCase().includes('login')) return <LogIn className="w-4 h-4 text-emerald-500" />;
    if (action.toLowerCase().includes('upload')) return <Upload className="w-4 h-4 text-indigo-500" />;
    return <History className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 dark:bg-[#0a0a0a] dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {logs.length === 0 && !loading ? (
            <div className="p-12 text-center text-slate-500">Chưa có lịch sử hoạt động.</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-neutral-900/50 border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">Thời gian</th>
                  <th className="px-6 py-3 font-semibold">Hành động</th>
                  <th className="px-6 py-3 font-semibold">Trạng thái</th>
                  <th className="px-6 py-3 font-semibold text-right">Thiết bị & IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-slate-900 dark:text-neutral-200 font-medium">
                        {new Date(log.created_at).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(log.created_at).toLocaleTimeString('vi-VN')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-neutral-800 rounded-full">
                          {getActionIcon(log.action)}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white capitalize">{log.action.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${log.status === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-neutral-300">
                          <Monitor className="w-3 h-3 text-slate-400" /> {log.device || 'Unknown'} - {log.browser || 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-neutral-500 mt-1">
                          <Globe className="w-3 h-3" /> {log.ip_address || 'Unknown IP'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
