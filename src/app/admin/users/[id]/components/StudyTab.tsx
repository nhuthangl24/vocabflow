import { useEffect, useState } from "react";
import { getUserStudyHistory } from "../actions";
import { BookOpen, Activity, Zap, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default function StudyTab({ userId }: { userId: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserStudyHistory(userId).then(data => {
      setHistory(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <div className="py-20 text-center text-neutral-500 text-sm">Đang tải Study Analytics...</div>;

  if (history.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-neutral-500 gap-3">
        <BookOpen className="w-10 h-10 opacity-20" />
        <p>User này chưa có lịch sử học tập (phiên học).</p>
      </div>
    );
  }

  const totalDuration = history.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
  const avgScore = history.filter(h => h.score > 0).reduce((acc, curr, i, arr) => acc + curr.score / arr.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Study Analytics</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
          <div className="text-xs text-neutral-500 mb-1">Tổng phiên học</div>
          <div className="text-xl font-bold text-white">{history.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
          <div className="text-xs text-neutral-500 mb-1">Thời gian học</div>
          <div className="text-xl font-bold text-white">{Math.floor(totalDuration / 60)} phút</div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
          <div className="text-xs text-neutral-500 mb-1">Điểm TB</div>
          <div className="text-xl font-bold text-white">{avgScore.toFixed(1)}</div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
          <div className="text-xs text-neutral-500 mb-1">Phiên gần nhất</div>
          <div className="text-sm font-bold text-white mt-1.5 truncate">
            {formatDistanceToNow(new Date(history[0].created_at), { addSuffix: true, locale: vi })}
          </div>
        </div>
      </div>
      
      <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="text-[10px] text-neutral-500 bg-neutral-900/40 uppercase tracking-wider sticky top-0 backdrop-blur-md">
              <tr>
                <th className="px-4 py-3 font-medium">Phiên học</th>
                <th className="px-4 py-3 font-medium">Video / Bài học</th>
                <th className="px-4 py-3 font-medium text-right">Hoàn thành</th>
                <th className="px-4 py-3 font-medium text-right">Điểm</th>
                <th className="px-4 py-3 font-medium text-right">Thời lượng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-xs">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-bold text-white flex items-center gap-1.5 uppercase">
                      {h.module === 'shadowing' ? <Zap className="w-3.5 h-3.5 text-indigo-400" /> : <BookOpen className="w-3.5 h-3.5 text-emerald-400" />}
                      {h.module}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-1">{new Date(h.created_at).toLocaleString('vi-VN')}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-neutral-300" title={h.media_assets?.title}>
                    {h.media_assets?.title || "Không rõ bài học"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${Math.min(h.completion_percentage || 0, 100)}%` }} />
                      </div>
                      <span className="font-mono text-[10px]">{h.completion_percentage || 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="font-bold text-amber-400">{h.score || 0}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-mono">
                    {Math.floor((h.duration_seconds || 0) / 60)}:{(h.duration_seconds || 0) % 60 < 10 ? '0' : ''}{(h.duration_seconds || 0) % 60}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
