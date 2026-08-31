"use client";

import { useState, useEffect } from "react";
import { Activity, Clock, CheckCircle2, AlertCircle, RefreshCw, Loader2, PlayCircle, Settings, HardDrive, Cpu, XCircle } from "lucide-react";
import toast from "react-hot-toast";

type Job = {
  id: string;
  user_id: string;
  media_id: string;
  status: string;
  progress: number;
  error_message: string | null;
  settings: any;
  created_at: string;
  updated_at: string;
  media_assets?: {
    title: string;
    status: string;
  };
};

export default function ProcessingClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/user/processing");
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs || []);
      } else {
        toast.error(data.error || "Failed to load jobs");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Poll every 5s for realtime updates
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'processing': return <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />;
      case 'pending': return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Completed</span>;
      case 'failed': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">Failed</span>;
      case 'processing': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span> Processing</span>;
      case 'pending': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">In Queue</span>;
      default: return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300">{status}</span>;
    }
  };

  const calculateDuration = (created: string, updated: string, status: string) => {
    const start = new Date(created).getTime();
    const end = status === 'completed' || status === 'failed' ? new Date(updated).getTime() : new Date().getTime();
    const diff = end - start;
    
    if (diff < 60000) return `${Math.floor(diff/1000)}s`;
    return `${Math.floor(diff/60000)}m ${Math.floor((diff%60000)/1000)}s`;
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Active & Recent Jobs</h2>
        <button 
          onClick={() => { setRefreshing(true); fetchJobs(); }}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 dark:bg-[#0a0a0a] dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 rounded-xl">
          <Activity className="w-12 h-12 text-slate-300 dark:text-neutral-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Chưa có video nào</h3>
          <p className="text-slate-500 dark:text-neutral-400">Bạn chưa tải lên hoặc xử lý video nào gần đây.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-neutral-900/50 border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">Tác vụ</th>
                  <th className="px-6 py-3 font-semibold">Trạng thái</th>
                  <th className="px-6 py-3 font-semibold">Tiến độ</th>
                  <th className="px-6 py-3 font-semibold">Thời gian</th>
                  <th className="px-6 py-3 font-semibold text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
                {jobs.map(job => (
                  <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getStatusIcon(job.status)}</div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white max-w-[300px] truncate">
                            {job.media_assets?.title || 'Unknown Video'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1 flex items-center gap-1 font-mono">
                            <HardDrive className="w-3 h-3" /> {job.id.substring(0,8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(job.status)}
                      {job.error_message && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1 max-w-[200px] truncate" title={job.error_message}>
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {job.error_message}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${job.status === 'failed' ? 'bg-red-500' : job.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            style={{ width: `${Math.max(5, job.status === 'completed' ? 100 : (job.progress || 0))}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-neutral-400 w-8">
                          {job.status === 'completed' ? 100 : (job.progress || 0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900 dark:text-neutral-200 font-medium">
                        {calculateDuration(job.created_at, job.updated_at, job.status) === '0s' && job.status === 'completed' ? '< 1s' : calculateDuration(job.created_at, job.updated_at, job.status)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1">
                        {new Date(job.created_at).toLocaleTimeString('vi-VN')}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {job.status === 'completed' ? (
                        <a 
                          href={`/study/${job.media_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-md transition-colors"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          Học ngay
                        </a>
                      ) : job.status === 'failed' ? (
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 dark:bg-red-500/10 dark:text-red-400 rounded-md">
                          Chi tiết lỗi
                        </button>
                      ) : (
                        <div className="inline-flex flex-col items-end">
                           <span className="text-xs text-slate-500 dark:text-neutral-500 flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 px-2 py-1 rounded">
                             <Cpu className="w-3 h-3" /> {job.settings?.model || 'Đang xử lý AI'}
                           </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
