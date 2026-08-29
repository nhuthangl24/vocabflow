"use client";

import { Bell, AlertTriangle, ShieldAlert, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { resolveAlertAdmin } from "./actions";

export function AlertsClient({ failedJobs }: { failedJobs: any[] }) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [jobs, setJobs] = useState(failedJobs);
  
  // Synthesize alerts from failed jobs
  const alerts = jobs.filter(j => j.status === 'failed' && !j.error_message?.startsWith('[ĐÃ GIẢI QUYẾT]')).map(job => ({
    id: `alert-${job.id}`,
    jobId: job.id,
    severity: 'high',
    title: 'Lỗi tiến trình ngầm (Background Job)',
    message: job.error_message || 'Tiến trình trích xuất thất bại không có thông báo lỗi.',
    time: job.created_at,
    status: 'active'
  }));

  const handleResolve = async (jobId: string) => {
    if (resolvingId) return;
    setResolvingId(jobId);
    try {
      const res = await resolveAlertAdmin(jobId);
      if (res.success) {
        setJobs(jobs.filter(j => j.id !== jobId));
      } else {
        alert("Lỗi khi giải quyết: " + res.error);
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally {
      setResolvingId(null);
    }
  };



  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            Trung tâm Cảnh báo
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Sự cố hệ thống, giới hạn API và tiến trình lỗi.</p>
        </div>
        <button className="px-3 py-1.5 bg-neutral-800 text-white rounded text-sm hover:bg-neutral-700 transition-colors">
          Đánh dấu đã đọc
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">Nghiêm trọng</p>
          <h3 className="text-3xl font-mono text-red-500 font-bold">{alerts.filter(a => a.severity === 'critical').length}</h3>
        </div>
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">Cao</p>
          <h3 className="text-3xl font-mono text-amber-500 font-bold">{alerts.filter(a => a.severity === 'high').length}</h3>
        </div>
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">Cảnh báo</p>
          <h3 className="text-3xl font-mono text-yellow-500 font-bold">{alerts.filter(a => a.severity === 'warning').length}</h3>
        </div>
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">Trạng thái Hệ thống</p>
          <div className="flex items-center gap-2 mt-2">
            {alerts.length === 0 ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-500 uppercase tracking-wider">BÌNH THƯỜNG</span>
              </>
            ) : alerts.some(a => a.severity === 'critical') ? (
              <>
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <span className="text-sm font-semibold text-red-500 uppercase tracking-wider">SỰ CỐ</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-semibold text-amber-500 uppercase tracking-wider">CẢNH BÁO</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#111] border border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 bg-[#151515]">
          <h3 className="text-sm font-semibold text-white">Sự cố đang diễn ra</h3>
        </div>
        <div className="divide-y divide-neutral-800/50">
          {alerts.map(alert => (
            <div key={alert.id} className="p-4 hover:bg-[#1a1a1a] transition-colors flex gap-4 items-start">
              <div className={`p-2 rounded-full shrink-0 ${
                alert.severity === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
              }`}>
                {alert.severity === 'critical' ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-white text-sm">{alert.title}</h4>
                  <span className="text-xs text-neutral-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(alert.time), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-neutral-400 font-mono bg-neutral-900 p-2 rounded mt-2 border border-neutral-800">
                  {alert.message}
                </p>
                <div className="mt-3 flex gap-2">
                  <button 
                    onClick={() => handleResolve(alert.jobId)}
                    disabled={resolvingId === alert.jobId}
                    className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-xs hover:bg-emerald-500/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {resolvingId === alert.jobId ? <Loader2 className="w-3 h-3 animate-spin" /> : "Giải quyết"}
                  </button>
                  <button className="px-2 py-1 bg-neutral-800 text-neutral-400 border border-neutral-700 rounded text-xs hover:text-white transition-colors">
                    Kiểm tra Log
                  </button>
                </div>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="p-12 text-center text-neutral-500">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/20 mb-3" />
              <p>Không có sự cố nào.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
