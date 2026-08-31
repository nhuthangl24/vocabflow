"use client";

import { useState, useMemo } from "react";
import { Search, PlayCircle, Clock, Filter } from "lucide-react";
import Link from "next/link";

interface ShadowingJob {
  id: string;
  status: string;
  provider: string | null;
  created_at: string;
  media_assets: { title: string } | null;
}

interface Props {
  jobs: ShadowingJob[];
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  processing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function ShadowingAdminClient({ jobs }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const title = job.media_assets?.title || "";
      const matchSearch =
        !search ||
        title.toLowerCase().includes(search.toLowerCase()) ||
        job.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || job.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [jobs, search, statusFilter]);

  const completedCount = jobs.filter((j) => j.status === "completed").length;
  const failedCount = jobs.filter((j) => j.status === "failed").length;
  const successRate = jobs.length > 0 ? Math.round((completedCount / jobs.length) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Shadowing Engine</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Quản lý transcription jobs và trạng thái shadowing
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề hoặc ID..."
              className="pl-9 pr-4 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 w-64 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-neutral-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Tổng jobs (recent 200)</div>
            <PlayCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-semibold text-white">{jobs.length}</div>
        </div>
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-neutral-900/50">
          <div className="text-sm font-medium text-neutral-400 mb-2">Tỷ lệ thành công</div>
          <div className={`text-2xl font-semibold ${successRate >= 90 ? "text-emerald-400" : successRate >= 70 ? "text-amber-400" : "text-red-400"}`}>
            {successRate}%
          </div>
        </div>
        <div className="p-5 rounded-xl border border-neutral-800/60 bg-neutral-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-neutral-400">Jobs lỗi</div>
            <Clock className="w-4 h-4 text-red-500" />
          </div>
          <div className={`text-2xl font-semibold ${failedCount > 0 ? "text-red-400" : "text-white"}`}>
            {failedCount}
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden">
        <table className="w-full text-left text-sm text-neutral-400">
          <thead className="text-xs text-neutral-500 bg-neutral-900/50 uppercase tracking-wider border-b border-neutral-800/60">
            <tr>
              <th className="px-6 py-4 font-medium">Job ID</th>
              <th className="px-6 py-4 font-medium">Media Asset</th>
              <th className="px-6 py-4 font-medium">Provider</th>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 font-medium">Ngày tạo</th>
              <th className="px-6 py-4 font-medium text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {filtered.map((job) => (
              <tr key={job.id} className="hover:bg-neutral-900/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-neutral-300 font-mono text-xs">
                  {job.id.slice(0, 8)}…
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-white font-medium truncate max-w-[200px]">
                  {job.media_assets?.title || "Unknown"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs">
                  {job.provider ? (
                    <span className="px-2 py-0.5 rounded border bg-neutral-800 border-neutral-700 text-neutral-300 uppercase text-[10px] font-bold tracking-wider">
                      {job.provider}
                    </span>
                  ) : (
                    <span className="text-neutral-600">default</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[job.status] || "bg-neutral-800 text-neutral-400 border-neutral-700"}`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-neutral-500 text-xs">
                  {new Date(job.created_at).toLocaleString("vi-VN")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Link href={`/admin/shadowing/${job.id}`} className="text-indigo-400 hover:text-indigo-300 text-xs transition-colors">
                    Xem →
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                  {search || statusFilter !== "all" ? "Không tìm thấy job nào phù hợp." : "Chưa có shadowing job."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
