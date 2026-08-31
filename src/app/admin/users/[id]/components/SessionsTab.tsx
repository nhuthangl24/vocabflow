import { useEffect, useState } from "react";
import { getUserSessions } from "../actions";
import { Laptop, Activity, MapPin, Monitor } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default function SessionsTab({ userId }: { userId: string }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserSessions(userId).then(data => {
      setSessions(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <div className="py-20 text-center text-neutral-500 text-sm">Đang tải Sessions...</div>;

  if (sessions.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-neutral-500 gap-3">
        <Laptop className="w-10 h-10 opacity-20" />
        <p>User này chưa có session nào được ghi nhận.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Active Sessions</h2>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-neutral-800">
                <Monitor className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-white">{session.os || "Unknown OS"}</span>
                  <span className="text-xs text-neutral-400">• {session.browser || "Unknown Browser"}</span>
                  {session.is_active && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">Active</span>
                  )}
                </div>
                <div className="text-xs text-neutral-500 flex items-center gap-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {session.country || "Unknown Location"} ({session.ip_address})</span>
                </div>
              </div>
            </div>
            
            <div className="text-right text-xs text-neutral-400">
              <div className="flex items-center justify-end gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5 text-neutral-500" />
                Active: <span className="text-white">{session.last_active_at ? formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true, locale: vi }) : "N/A"}</span>
              </div>
              <div className="text-[10px] text-neutral-500">
                Created: {new Date(session.created_at).toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
