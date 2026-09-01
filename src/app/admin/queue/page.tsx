"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ListTree, Search, Play, Pause, AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminQueuePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase
        .from("transcript_jobs")
        .select("*, media_assets(title)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setJobs(data);
    };
    fetchJobs();

    const channel = supabase.channel("queue_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "transcript_jobs" }, (payload) => {
        setJobs(prev => {
          if (payload.eventType === 'INSERT') return [payload.new, ...prev].slice(0, 50);
          if (payload.eventType === 'UPDATE') return prev.map(j => j.id === payload.new.id ? { ...j, ...payload.new } : j);
          return prev;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const completedJobs = jobs.filter(j => j.status === 'completed');
  let avgWaitTime = "N/A";
  if (completedJobs.length > 0) {
    const totalMs = completedJobs.reduce((acc, j) => {
      // Assuming updated_at exists, fallback to 0
      const duration = new Date(j.updated_at || j.created_at).getTime() - new Date(j.created_at).getTime();
      return acc + duration;
    }, 0);
    const avgMs = totalMs / completedJobs.length;
    avgWaitTime = avgMs > 0 ? `${(avgMs / 1000).toFixed(1)}s` : "< 1s";
  }

  const stats = {
    pending: jobs.filter(j => j.status === 'pending').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            Hàng đợi Xử lý (Queue)
            {stats.processing > 0 && (
              <span className="relative flex h-3 w-3 ml-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
            )}
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Các tiến trình nền (Dữ liệu thực tế, Realtime)</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-300 hover:text-white transition-colors shadow-sm flex items-center gap-2">
            <Pause className="w-4 h-4" /> Tạm dừng
          </button>
          <button className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-sm text-indigo-400 hover:bg-indigo-500/20 transition-colors shadow-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Thử lại Task lỗi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-neutral-800/60 bg-[#0a0a0a]">
          <div className="text-sm font-medium text-neutral-400 mb-1">Đang chờ (Pending)</div>
          <div className="text-2xl font-semibold text-white">{stats.pending + stats.processing}</div>
        </div>
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
          <div className="text-sm font-medium text-indigo-400 mb-1">Đang xử lý (Processing)</div>
          <div className="text-2xl font-semibold text-white">{stats.processing}</div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-800/60 bg-[#0a0a0a]">
          <div className="text-sm font-medium text-neutral-400 mb-1">Thời gian chờ (TB)</div>
          <div className="text-2xl font-semibold text-white">{avgWaitTime}</div>
        </div>
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
          <div className="text-sm font-medium text-red-400 mb-1">Lỗi (Failed)</div>
          <div className="text-2xl font-semibold text-white">{stats.failed}</div>
        </div>
      </div>

      <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden shadow-xl shadow-black/40">
        <div className="px-4 py-3 border-b border-neutral-800/60 bg-neutral-900/30 flex items-center justify-between">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search by ID or title..." 
              className="pl-9 pr-4 py-1 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 w-64"
            />
          </div>
        </div>
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="text-xs text-neutral-500 bg-neutral-900/90 backdrop-blur-md uppercase tracking-wider sticky top-0 z-10 shadow-sm shadow-black/20">
              <tr>
                <th className="px-5 py-3 font-medium">Mã Job</th>
                <th className="px-5 py-3 font-medium">Loại Task</th>
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium">Tiến trình</th>
                <th className="px-5 py-3 font-medium">Thời gian tạo</th>
                <th className="px-5 py-3 font-medium">Thời lượng</th>
                <th className="px-5 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-neutral-900/30 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap font-mono text-xs text-neutral-300">
                    {job.id?.slice(0, 8)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="text-white font-medium">TRANSCRIPTION</div>
                    <div className="text-xs text-neutral-500 truncate max-w-[200px]">{job.media_assets?.title || 'Unknown Media'}</div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${
                      job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      job.status === 'processing' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      job.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {job.status === 'processing' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />}
                      {job.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="w-32 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${job.status === 'failed' ? 'bg-red-500' : 'bg-indigo-500'}`} 
                        style={{ width: job.status === 'completed' ? '100%' : job.status === 'processing' ? '45%' : '0%' }}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-xs">
                    <div className="text-neutral-300 font-mono">
                      {new Date(job.created_at).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                    </div>
                    <div className="text-neutral-500 mt-0.5">
                      {(() => {
                        const diff = Date.now() - new Date(job.created_at).getTime();
                        const mins = Math.floor(diff / 60000);
                        const secs = Math.floor((diff % 60000) / 1000);
                        if (mins >= 60) return `${Math.floor(mins/60)} giờ ${mins%60} phút trước`;
                        if (mins > 0) return `${mins} phút ${secs}s trước`;
                        return `${secs}s trước`;
                      })()}
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-xs">
                    {(() => {
                      const end = job.updated_at ? new Date(job.updated_at).getTime() : Date.now();
                      const start = new Date(job.created_at).getTime();
                      const ms = end - start;
                      const mins = Math.floor(ms / 60000);
                      const secs = Math.floor((ms % 60000) / 1000);
                      if (job.status === 'pending') return <span className="text-neutral-600">—</span>;
                      return (
                        <span className={`font-mono ${
                          mins >= 5 ? 'text-red-400' : mins >= 2 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {mins > 0 ? `${mins}ph ${secs}s` : `${secs}s`}
                          {job.status === 'processing' && <span className="ml-1 text-indigo-400 animate-pulse">●</span>}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-right">
                    {job.status === 'failed' && (
                      <button className="text-indigo-400 hover:text-indigo-300" title="Retry">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-neutral-500">Không có job nào trong hàng đợi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
