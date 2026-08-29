"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Activity, Cpu, Play, Square, RotateCw, CheckCircle2, AlertTriangle, Clock, Loader2, Timer } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cancelJobAdmin, retryJobAdmin } from "./actions";

function formatProcessingTime(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime();
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return s > 0 ? `${m}p ${s}s` : `${m}p`;
}


export function TaskMonitorClient({ initialJobs }: { initialJobs: any[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Tick every second to update elapsed/ETA for active jobs
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Estimated total duration (ms) per status stage based on benchmarks
  const STATUS_ETA_MS: Record<string, number> = {
    queued: 3 * 60 * 1000,        // ~3 min
    extracting_audio: 4 * 60 * 1000,  // ~4 min
    transcribing: 8 * 60 * 1000,  // ~8 min
    analyzing: 10 * 60 * 1000,    // ~10 min
    processing: 10 * 60 * 1000,
    pending: 3 * 60 * 1000,
  };

  const getEta = (job: any) => {
    const estimated = STATUS_ETA_MS[job.status];
    if (!estimated) return null;
    const elapsed = now - new Date(job.created_at).getTime();
    const remaining = estimated - elapsed;
    if (remaining <= 0) return "Sắp xong...";
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return mins > 0 ? `~${mins}p ${secs}s` : `~${secs}s`;
  };

  const handleAction = async (jobId: string, action: 'cancel' | 'retry') => {
    if (processingId) return;
    setProcessingId(jobId);
    try {
      const res = action === 'cancel' ? await cancelJobAdmin(jobId) : await retryJobAdmin(jobId);
      if (res.success) {
        setJobs(jobs.map(j => j.id === jobId ? { ...j, status: action === 'cancel' ? 'failed' : 'pending' } : j));
      } else {
        alert("Lỗi: " + res.error);
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredJobs = jobs.filter(j => 
    !search || 
    j.id.includes(search) || 
    j.media_assets?.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    j.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = useMemo(() => {
    return {
      total: jobs.length,
      completed: jobs.filter(j => j.status === 'completed').length,
      processing: jobs.filter(j => j.status === 'processing' || j.status === 'pending').length,
      failed: jobs.filter(j => j.status === 'failed').length,
    };
  }, [jobs]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Giám sát Tiến trình
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Giám sát các tác vụ Extract, Transcribe và AI đang chạy ngầm.</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Tìm ID, Media, Tên, Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#111] border border-neutral-800 text-sm rounded-md pl-9 pr-4 py-1.5 focus:outline-none focus:border-neutral-600 text-white w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Tổng Tiến trình</p>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-3xl font-mono text-white font-bold">{stats.total}</h3>
        </div>
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Hoàn tất</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-3xl font-mono text-white font-bold">{stats.completed}</h3>
        </div>
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Đang xử lý</p>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-3xl font-mono text-white font-bold">{stats.processing}</h3>
        </div>
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Lỗi / Thất bại</p>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <h3 className="text-3xl font-mono text-white font-bold">{stats.failed}</h3>
        </div>
      </div>

      <div className="bg-[#111] border border-neutral-800 rounded-lg flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead className="bg-[#151515] text-neutral-400 border-b border-neutral-800 sticky top-0 z-10 shadow-sm font-sans text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Tiến trình</th>
                <th className="px-4 py-2 font-medium">Người dùng</th>
                <th className="px-4 py-3 font-semibold">Tên Media</th>
                <th className="px-4 py-3 font-semibold">Giai đoạn</th>
                <th className="px-4 py-3 font-semibold">ETA</th>
                <th className="px-4 py-3 font-semibold">Thời gian</th>
                <th className="px-4 py-3 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/30">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-neutral-900/40 transition-all duration-200 group">
                  <td className="px-4 py-3 text-neutral-500 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${job.status === 'completed' ? 'bg-emerald-500' : job.status === 'failed' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                      {job.id.substring(0, 8)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {job.user_email !== "Unknown" ? (
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">{job.user_name !== "Unknown" ? job.user_name : job.user_email}</span>
                        {job.user_name !== "Unknown" && <span className="text-[11px] text-neutral-500">{job.user_email}</span>}
                      </div>
                    ) : (
                      <span className="text-neutral-500 font-medium text-sm bg-neutral-800/50 px-2 py-0.5 rounded-md inline-block">System</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <div className="text-white font-medium text-sm max-w-[280px] truncate" title={job.media_assets?.title}>
                        {job.media_assets?.title || "Không rõ"}
                      </div>
                      {job.media_assets?.module === 'shadowing' ? (
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">Shadowing</span>
                      ) : (
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 rounded">Từ vựng</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3">
                    {getEta(job) ? (
                      <span className="flex items-center gap-1 text-amber-400 font-mono text-xs bg-amber-500/5 px-2 py-1 rounded-md border border-amber-500/10">
                        <Timer className="w-3 h-3" />
                        {getEta(job)}
                      </span>
                    ) : (
                      <span className="text-neutral-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-400 font-mono text-[11px]">
                    <div>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</div>
                    {job.completed_at && (
                      <div className="text-[10px] text-emerald-600/80 mt-0.5 bg-emerald-500/5 px-1 py-0.5 rounded-sm inline-block">
                        ⏱ {formatProcessingTime(new Date(job.created_at), new Date(job.completed_at))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    {processingId === job.id ? (
                      <button disabled className="p-1.5 bg-neutral-800 text-neutral-500 rounded cursor-not-allowed">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </button>
                    ) : job.status === 'processing' || job.status === 'pending' || job.status === 'queued' || job.status === 'extracting_audio' || job.status === 'transcribing' || job.status === 'analyzing' ? (
                      <button 
                        onClick={() => handleAction(job.id, 'cancel')}
                        className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded" 
                        title="Dừng tiến trình"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleAction(job.id, 'retry')}
                        className="p-1.5 bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded" 
                        title="Thử lại"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-600 font-sans">Không tìm thấy tiến trình nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-[#151515] border-t border-neutral-800 px-4 py-2 text-xs text-neutral-500 flex justify-between items-center">
          <span>Đang hiển thị {filteredJobs.length} tiến trình</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Đang đồng bộ trực tiếp
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch(status) {
    case 'completed':
      return <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 inline-flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3"/>Hoàn tất</span>;
    case 'failed':
      return <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-red-500/10 text-red-500 border border-red-500/20 inline-flex items-center gap-1.5"><AlertTriangle className="w-3 h-3"/>Thất bại</span>;
    case 'queued':
      return <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-neutral-700/30 text-neutral-400 border border-neutral-700/50 inline-flex items-center gap-1.5"><Clock className="w-3 h-3"/>Chờ xử lý</span>;
    case 'extracting_audio':
      return <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1.5 animate-pulse"><Cpu className="w-3 h-3"/>Tách âm thanh</span>;
    case 'transcribing':
      return <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 inline-flex items-center gap-1.5 animate-pulse"><Activity className="w-3 h-3"/>Chuyển văn bản</span>;
    case 'analyzing':
      return <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-pink-500/10 text-pink-400 border border-pink-500/20 inline-flex items-center gap-1.5 animate-pulse"><Activity className="w-3 h-3"/>AI Phân tích</span>;
    case 'processing':
    case 'pending':
      return <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 inline-flex items-center gap-1.5 animate-pulse"><Loader2 className="w-3 h-3 animate-spin"/>Đang xử lý</span>;
    default:
      return <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-neutral-800 text-neutral-400 border border-neutral-700">{status}</span>;
  }
}
