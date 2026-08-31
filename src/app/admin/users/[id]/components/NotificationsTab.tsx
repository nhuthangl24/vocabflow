import { useEffect, useState } from "react";
import { getUserNotifications } from "../actions";
import { Bell, BellRing, Mail, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default function NotificationsTab({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserNotifications(userId).then(data => {
      setNotifications(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <div className="py-20 text-center text-neutral-500 text-sm">Đang tải Notifications...</div>;

  if (notifications.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-neutral-500 gap-3">
        <Bell className="w-10 h-10 opacity-20" />
        <p>User này chưa nhận được thông báo nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Notifications History</h2>
      </div>

      <div className="space-y-3">
        {notifications.map((notif) => (
          <div key={notif.id} className={`border rounded-xl p-4 flex gap-4 ${
            notif.is_read 
              ? 'bg-neutral-900/10 border-neutral-800/50 opacity-70' 
              : 'bg-neutral-900/50 border-neutral-800'
          }`}>
            <div className={`p-2.5 rounded-lg shrink-0 ${
              notif.type === 'system' ? 'bg-indigo-500/10 text-indigo-400' :
              notif.type === 'billing' ? 'bg-emerald-500/10 text-emerald-400' :
              notif.type === 'alert' ? 'bg-red-500/10 text-red-400' :
              'bg-amber-500/10 text-amber-400'
            }`}>
              {notif.is_read ? <CheckCircle2 className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white">{notif.title}</h3>
              <p className="text-xs text-neutral-400 mt-1">{notif.content}</p>
              
              <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-500">
                <span>Gửi lúc: {new Date(notif.created_at).toLocaleString('vi-VN')}</span>
                {notif.is_read && notif.read_at && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-500">Đã đọc lúc {new Date(notif.read_at).toLocaleString('vi-VN')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
