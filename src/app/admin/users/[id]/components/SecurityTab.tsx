import { useEffect, useState } from "react";
import { getUserLoginHistory } from "../actions";
import { Shield, ShieldAlert, Key, LogIn, LogOut } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default function SecurityTab({ userId }: { userId: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserLoginHistory(userId).then(data => {
      setHistory(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <div className="py-20 text-center text-neutral-500 text-sm">Đang tải Login History...</div>;

  if (history.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-neutral-500 gap-3">
        <Shield className="w-10 h-10 opacity-20" />
        <p>Không có lịch sử đăng nhập nào được ghi nhận.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Security & Login History</h2>
        <span className="text-xs text-neutral-500">{history.length} lần đăng nhập gần nhất</span>
      </div>

      <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl overflow-hidden shadow-xl shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="text-[10px] text-neutral-500 bg-neutral-900/40 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">Sự kiện</th>
                <th className="px-4 py-3 font-medium">Thiết bị & OS</th>
                <th className="px-4 py-3 font-medium">Vị trí & IP</th>
                <th className="px-4 py-3 font-medium text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-xs">
              {history.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <LogIn className="w-3 h-3" />
                      </div>
                      <span className="font-medium text-white">Đăng nhập thành công</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-neutral-300 font-medium">{log.os || "Unknown OS"}</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">{log.browser || "Unknown Browser"}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-neutral-300">{log.country || "Unknown Location"}</div>
                    <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{log.ip_address}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="text-neutral-300">
                      {new Date(log.login_time).toLocaleString('vi-VN')}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      {formatDistanceToNow(new Date(log.login_time), { addSuffix: true, locale: vi })}
                    </div>
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
