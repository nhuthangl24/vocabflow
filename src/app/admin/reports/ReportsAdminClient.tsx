"use client";

import { useState, useEffect, Fragment } from "react";
import { Flag, CheckCircle, Clock, XCircle, Search, Filter, MessageSquare, Save, Play, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

export default function ReportsAdminClient() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Expanded report for inline editing
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Editing state
  const [editText, setEditText] = useState("");
  const [editIpa, setEditIpa] = useState("");
  const [editTrans, setEditTrans] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?status=${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi tải danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = (report: any) => {
    if (expandedId === report.id) {
      setExpandedId(null);
    } else {
      setExpandedId(report.id);
      setEditText(report.transcript_segments?.text || "");
      setEditIpa(report.transcript_segments?.ipa || "");
      setEditTrans(report.transcript_segments?.translation || "");
    }
  };

  const handleResolve = async (id: string, action: "publish_fix" | "reject" | "duplicate") => {
    setIsPublishing(true);
    const toastId = toast.loading("Đang xử lý...");
    
    try {
      let status = "resolved";
      if (action === "reject") status = "rejected";
      if (action === "duplicate") status = "duplicate";

      const payload = {
        status,
        action,
        text: editText,
        ipa: editIpa,
        translation: editTrans
      };

      const res = await fetch(`/api/admin/reports/${id}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(action === "publish_fix" ? "Đã sửa và Publish thành công!" : "Đã chuyển trạng thái", { id: toastId });
        setExpandedId(null);
        fetchReports();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi xử lý", { id: toastId });
    } finally {
      setIsPublishing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'open': return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock className="w-3.5 h-3.5"/> Open</span>;
      case 'resolved': return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle className="w-3.5 h-3.5"/> Resolved</span>;
      case 'rejected': return <span className="px-2.5 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-xs font-bold flex items-center gap-1 w-max"><XCircle className="w-3.5 h-3.5"/> Rejected</span>;
      case 'duplicate': return <span className="px-2.5 py-1 bg-slate-500/10 text-slate-500 border border-slate-500/20 rounded-full text-xs font-bold flex items-center gap-1 w-max"><MessageSquare className="w-3.5 h-3.5"/> Duplicate</span>;
      default: return <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-xs font-bold w-max">{status}</span>;
    }
  };

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      subtitle_error: "CC Sai", translation_error: "Dịch Sai", timestamp_error: "Lệch Thời Gian",
      split_error: "Ngắt Câu Sai", missing_sentence: "Mất Câu", ai_context_error: "AI Dịch Sai Ngữ Cảnh", other: "Khác"
    };
    return map[cat] || cat;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Flag className="w-7 h-7 text-red-500" /> Quản lý Báo Lỗi Phụ Đề
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Inline Editor giúp sửa nhanh và publish trực tiếp không cần mở Video Editor.</p>
        </div>
        <div className="flex gap-4">
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="open">Open (Chưa xử lý)</option>
            <option value="resolved">Resolved (Đã sửa)</option>
            <option value="rejected">Rejected (Từ chối)</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-neutral-900/50 text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800">
              <tr>
                <th className="px-6 py-4 font-semibold w-1/4">Video & Nguồn</th>
                <th className="px-6 py-4 font-semibold">Phân loại</th>
                <th className="px-6 py-4 font-semibold text-center">Votes</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold">Ngày tạo</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-500">Không có báo cáo nào.</td></tr>
              ) : reports.map(r => (
                <Fragment key={r.id}>
                  <tr className={`hover:bg-slate-50 dark:hover:bg-neutral-900/30 transition-colors ${expandedId === r.id ? 'bg-slate-50 dark:bg-neutral-900/50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">{r.media_assets?.title}</div>
                      <div className="text-xs text-slate-500 mt-1 flex gap-2">
                        <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-1.5 rounded">{r.room}</span>
                        ID: {r.reporter_id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700 dark:text-neutral-300">{getCategoryLabel(r.category)}</div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-1">{r.description || "Không có mô tả"}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center bg-slate-100 dark:bg-neutral-800 font-bold w-8 h-8 rounded-full text-slate-700 dark:text-neutral-300">
                        {r.vote_count}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleExpand(r)}
                        className="p-2 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                      >
                        {expandedId === r.id ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Detail / Editor row */}
                  {expandedId === r.id && (
                    <tr>
                      <td colSpan={6} className="p-0 border-b-2 border-indigo-500/30 bg-slate-50/50 dark:bg-[#151515]">
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                          
                          {/* Left Column: Report Details */}
                          <div className="space-y-4">
                            <h4 className="font-bold text-slate-800 dark:text-neutral-200 border-b border-slate-200 dark:border-neutral-800 pb-2 flex justify-between">
                              <span>Chi tiết báo lỗi</span>
                              <a href={r.media_assets?.source_url} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline flex items-center gap-1 text-xs">
                                Xem video gốc <ExternalLink className="w-3 h-3"/>
                              </a>
                            </h4>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Mô tả của người dùng</p>
                              <p className="text-sm bg-white dark:bg-neutral-900 p-3 rounded-xl border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300">
                                {r.description || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Gợi ý sửa đổi</p>
                              <p className="text-sm bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400">
                                {r.suggestion?.correct_text || "N/A"}
                              </p>
                            </div>
                            <div className="flex gap-4">
                              <p className="text-xs text-slate-500"><strong className="text-slate-700 dark:text-neutral-300">Timestamp:</strong> {r.transcript_segments?.start_time_ms}ms - {r.transcript_segments?.end_time_ms}ms</p>
                            </div>
                          </div>
                          
                          {/* Right Column: Inline Editor */}
                          <div className="space-y-4">
                            <h4 className="font-bold text-slate-800 dark:text-neutral-200 border-b border-slate-200 dark:border-neutral-800 pb-2">
                              Inline Editor (Dữ liệu gốc)
                            </h4>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Tiếng Anh (CC)</label>
                                <textarea 
                                  value={editText} onChange={e => setEditText(e.target.value)} disabled={isPublishing || r.status !== 'open'}
                                  className="w-full text-sm bg-white dark:bg-neutral-900 p-3 rounded-xl border border-slate-300 dark:border-neutral-700 focus:border-indigo-500 outline-none text-slate-800 dark:text-neutral-200 font-medium"
                                  rows={2}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Phiên âm IPA</label>
                                <input 
                                  value={editIpa} onChange={e => setEditIpa(e.target.value)} disabled={isPublishing || r.status !== 'open'}
                                  className="w-full text-sm font-mono bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-slate-300 dark:border-neutral-700 focus:border-indigo-500 outline-none text-slate-600 dark:text-neutral-400"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Vietsub</label>
                                <textarea 
                                  value={editTrans} onChange={e => setEditTrans(e.target.value)} disabled={isPublishing || r.status !== 'open'}
                                  className="w-full text-sm bg-white dark:bg-neutral-900 p-3 rounded-xl border border-slate-300 dark:border-neutral-700 focus:border-indigo-500 outline-none text-slate-800 dark:text-neutral-200"
                                  rows={2}
                                />
                              </div>
                            </div>
                            
                            {r.status === 'open' && (
                              <div className="flex justify-end gap-3 pt-2">
                                <button 
                                  onClick={() => handleResolve(r.id, "duplicate")} disabled={isPublishing}
                                  className="px-4 py-2 text-sm font-bold bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-300 dark:hover:bg-neutral-700 rounded-xl"
                                >
                                  Đánh dấu Trùng
                                </button>
                                <button 
                                  onClick={() => handleResolve(r.id, "reject")} disabled={isPublishing}
                                  className="px-4 py-2 text-sm font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-xl"
                                >
                                  Từ chối
                                </button>
                                <button 
                                  onClick={() => handleResolve(r.id, "publish_fix")} disabled={isPublishing}
                                  className="px-6 py-2 text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                                >
                                  <Save className="w-4 h-4"/> Publish Fix
                                </button>
                              </div>
                            )}
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
